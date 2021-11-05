const output = (ctx, data, code = 0) => {
  ctx.status = 200;
  ctx.body = {
    code,
    data,
  };
};

/**
 *  返回实例信息
 *  version
 *  steps
 *  clientIDs
 *  users
 */
const formatChange = (inst, data) => ({
  version: inst.version,
  steps: data.steps.map((s) => s.toJSON()),
  clientIDs: data.steps.map((step) => step.clientID),
  users: data.users,
});

module.exports = {
  output,
  formatChange,
};
