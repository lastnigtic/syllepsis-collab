const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('koa2-cors');
const { router } = require('./router');
const { PORT } = require('./consts');

const server = new Koa();

server.use(
  cors({
    origin(ctx) {
      if (/^\/docs/.test(ctx.url)) {
        return '*';
      }
      return false;
    },
    allowMethods: ['GET', 'POST'],
  })
);
server.use(bodyParser());
server.use(router.routes());

server.listen(PORT, () => {
  console.log(`start server at port ${PORT}`);
});
