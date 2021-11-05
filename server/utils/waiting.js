const { output } = require('./output');
const { TIME_OUT } = require('../consts');

class Waiting {
  constructor(ctx, instance, uId, finish) {
    this.ctx = ctx;
    this.instance = instance;
    this.uId = uId;
    this.finish = finish;
    this.done = false;

    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });

    setTimeout(() => {
      this.abort();
      this.send({});
    }, TIME_OUT);
  }

  abort() {
    const found = this.instance.waiting.indexOf(this);
    if (found > -1) this.instance.waiting.splice(found, 1);
  }

  send(data) {
    if (this.done) return;
    output(this.ctx, data);
    this.done = true;
    this.resolve();
  }
}

module.exports = {
  Waiting,
};
