export class Router {
  constructor(onChange) {
    this.onChange = onChange;
    this.stack = [];
  }

  push(screen, params = {}) {
    this.stack.push({ screen, params });
    this.onChange(this.current());
  }

  back() {
    if (this.stack.length > 1) this.stack.pop();
    this.onChange(this.current());
  }

  current() {
    return this.stack[this.stack.length - 1] || null;
  }
}
