const { getInstance } = require('../doc');
const { Waiting } = require('../utils/waiting');
const { output, formatChange } = require('../utils/output');
const { reqID } = require('../utils');
const { BAD_VERSION_CODE } = require('../consts');

const register = (router) => {
	router.get('/docs/:id/events', async (ctx, next) => {
		const version = ctx.request.query.version;
		const instance = getInstance(ctx.params.id, reqID(ctx.request));
		const data = instance.getEvents(version);
		if (!data) return output(ctx, '历史版本不存在！', BAD_VERSION_CODE);
		if (data.steps.length) {
			return output(ctx, formatChange(instance, data));
		}

		// 获取下一个版本，等待合并完成
		const wait = new Waiting(ctx, instance, reqID(ctx.request), () => {
			return wait.send(formatChange(instance, instance.getEvents(version)));
		});
		instance.waiting.push(wait);

		await next();

		await wait.promise;
	});
};

module.exports = {
	register,
};
