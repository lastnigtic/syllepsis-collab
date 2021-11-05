const Router = require('@koa/router');
const fs = require('fs');
const { CONTROLLER_PATH } = require('./consts');

const router = new Router();

fs.readdirSync(CONTROLLER_PATH).map((name) => {
  require(`${CONTROLLER_PATH}/${name}`).register(router);
});

module.exports = {
  router,
};
