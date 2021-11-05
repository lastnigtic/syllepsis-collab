const { Step } = require('prosemirror-transform');
const { getInstance } = require('../doc');
const { output } = require('../utils/output');
const { reqID } = require('../utils');
const { CONFLICT_CODE } = require('../consts');

const register = (router) =>
  router.post('/docs/:id/events', (ctx, next) => {
    const { version, clientID, steps: stepData } = ctx.request.body;
    const instance = getInstance(ctx.params.id, reqID(ctx.request));

    let steps = stepData.map((s) => Step.fromJSON(instance.schema, s));

    let result = instance.addEvents(version, steps, clientID);

    if (!result) return output(ctx, 'Version not current', CONFLICT_CODE);
    else return output(ctx, result);
  });

module.exports = {
  register,
};
