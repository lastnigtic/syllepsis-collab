const { getInstance } = require('../doc');
const { output } = require('../utils/output');
const { reqID } = require('../utils');

const register = (router) =>
	router.post('/docs/:id', (ctx, next) => {
		const { schema } = ctx.request.body;
		const instance = getInstance(ctx.params.id, reqID(ctx.request), schema);

		return output(ctx, {
			doc: instance.doc.toJSON(),
			user: instance.userCount,
			version: instance.version,
		});
	});

module.exports = {
	register,
};
