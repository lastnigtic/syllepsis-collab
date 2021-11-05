const { Schema } = require('prosemirror-model');
const { writeFile } = require('fs');
const { MAX_STEP_HISTORY, SAVE_FILE } = require('../consts');

// 存储所有文档实例
const instances = Object.create(null);
let instanceCount = 0;
let maxCount = 30;

// 获取当前的文档，新创建时使用SchemaSpec
const getInstance = (id, uId, schemaSpec) => {
	let inst = instances[id] || newInstance(id, schemaSpec);
	if (uId) inst.registerUser(uId);
	inst.lastActive = Date.now();
	return inst;
};

const newInstance = (id, schemaSpec, doc) => {
	if (++instanceCount > maxCount) {
		let oldest = null;
		for (let id in instances) {
			let inst = instances[id];
			if (!oldest || inst.lastActive < oldest.lastActive) oldest = inst;
		}
		instances[oldest.id].stop();
		delete instances[oldest.id];
		--instanceCount;
	}
	return (instances[id] = new Instance(id, schemaSpec, doc));
};

const instanceInfo = () => {
	let found = [];
	for (let id in instances) found.push({ id: id, users: instances[id].userCount });
	return found;
};

const doSave = () => {
	saveTimeout = null;
	let out = {};
	for (var prop in instances) {
		out[prop] = { doc: instances[prop].doc.toJSON() };
	}
	writeFile(SAVE_FILE, JSON.stringify(out), () => null);
};

let saveTimeout = null,
	saveEvery = 1e4;
const scheduleSave = () => {
	if (saveTimeout != null) return;
	saveTimeout = setTimeout(doSave, saveEvery);
};

class Instance {
	constructor(id, schemaSpec, doc) {
		this.id = id;
		this.schema = new Schema(schemaSpec);
		this.doc =
			doc || this.schema.node('doc', null, [this.schema.node('paragraph', null, [this.schema.text('hello guys!')])]);
		this.version = 0;
		this.steps = [];
		this.lastActive = Date.now();
		this.users = Object.create(null);
		this.userCount = 0;
		this.waiting = [];
		this.collecting = null;
	}

	// 若请求版本大于当前版本，抛错
	checkVersion(version) {
		if (version < 0 || version > this.version) {
			let err = new Error('Invalid version ' + version);
			err.status = 400;
			throw err;
		}
	}

	addEvents(version, steps, clientID) {
		this.checkVersion(version);
		if (this.version !== version) return false;
		let doc = this.doc;
		let maps = [];
		steps.forEach((step) => {
			step.clientID = clientID;
			let result = step.apply(doc);
			doc = result.doc;
			maps.push(step.getMap());
		});

		this.doc = doc;
		this.version += steps.length;
		this.step = this.steps.push(...steps);
		if (this.steps.length > MAX_STEP_HISTORY) {
			this.steps = this.steps.slice(this.steps.length - MAX_STEP_HISTORY);
		}

		scheduleSave();
		this.sendUpdates();

		return {
			version: this.version,
		};
	}

	getEvents(version) {
		this.checkVersion(version);
		let startIdx = this.steps.length - (this.version - version);
		if (startIdx < 0) return false;
		return {
			steps: this.steps.slice(startIdx),
			users: this.userCount,
		};
	}

	sendUpdates() {
		while (this.waiting.length) this.waiting.pop().finish();
	}

	collectUsers() {
		const oldUserCount = this.userCount;
		this.users = Object.create(null);
		this.userCount = 0;
		this.collecting = null;
		for (let i = 0; i < this.waiting.length; i++) this._registerUser(this.waiting[i].uId);
		if (this.userCount != oldUserCount) this.sendUpdates();
	}

	registerUser(uId) {
		if (!(uId in this.users)) {
			this._registerUser(uId);
			this.sendUpdates();
		}
	}

	_registerUser(uId) {
		if (!(uId in this.users)) {
			this.users[uId] = true;
			this.userCount++;
			if (this.collecting == null) this.collecting = setTimeout(() => this.collectUsers(), 5000);
		}
	}

	stop() {
		if (this.collecting != null) clearInterval(this.collecting);
	}
}
module.exports = {
	Instance,
	getInstance,
	newInstance,
	instanceInfo,
};
