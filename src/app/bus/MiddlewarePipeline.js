class MiddlewarePipeline {
  constructor(middlewares) {
    this.middlewares = middlewares || [];
  }

  async execute(context, handler) {
    let index = -1;
    const run = async (i) => {
      if (i <= index) throw new Error('next() called multiple times');
      index = i;
      const mw = this.middlewares[i];
      if (mw) return mw.handle(context, () => run(i + 1));
      return handler(context);
    };
    return run(0);
  }
}

module.exports = MiddlewarePipeline;
