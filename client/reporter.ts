class Reporter {
  state: 'fail' | null;
  node: null | HTMLElement;
  setAt: number;

  constructor() {
    this.state = null;
    this.node = null;
    this.setAt = 0;
  }

  clearState() {
    if (this.state) {
      document.body.removeChild(this.node);
      this.state = null;
      this.node = null;
      this.setAt = 0;
    }
  }

  failure(err) {
    this.show('fail', err.toString());
  }

  success() {
    if (this.state === 'fail' && this.setAt > Date.now() - 1000 * 10) {
      setTimeout(() => this.success(), 5000);
    } else {
      this.clearState();
    }
  }

  delay(err) {
    if (this.state === 'fail') return;
    this.show('delay', err.toString());
  }

  show(type, message) {
    this.clearState();
    this.state = type;
    this.setAt = Date.now();
    this.node = document.body.appendChild(document.createElement('div'));
    this.node.className = 'report-wrapper';
    this.node.textContent = message;
  }
}

export { Reporter };
