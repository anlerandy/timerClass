const SECOND = 1000;
const MINUTE = 60 * SECOND;

const createdAt = new WeakMap();
const aborted = new WeakMap();
const lastUpdate = new WeakMap();
const inProgress = new WeakMap();
const timeId = new WeakMap();
const CALLBACK = new WeakMap();
const ARG = new WeakMap();

const Timer = class {
  constructor(timer) {
    lastUpdate.set(this, new Date());
    createdAt.set(this, new Date());
    this.startedAt;
    aborted.set(this, false);
    inProgress.set(this, false);
    this.timer = timer || 2 * MINUTE;
  }

  get createdAt() {
    return createdAt.get(this);
  }

  get lastUpdate() {
    return lastUpdate.get(this);
  }

  get inProgress() {
    return inProgress.get(this);
  }

  get timeId() {
    return timeId.get(this);
  }

  get isAborted() {
    return aborted.get(this);
  }

  done() {
    inProgress.set(this, false);
    if (this.timeId) clearTimeout(this.timeId);
  }

  abort() {
    aborted.set(this, true);
    this.done();
  }

  update() {
    lastUpdate.set(this, new Date());
  }

  launchTimer(callback, arg = 'TimeOut') {
    if (callback instanceof Promise) return this.launchTimerPromise(callback, arg);
    if (callback && {}.toString.call(callback) !== '[object Function]')
			throw new Error('The passed callback is not a function.');
		// Protect callback at creation.
		CALLBACK.set(this, callback);
		ARG.set(this, arg);
    if (this.inProgress) throw new Error('Timer already launched.');
    aborted.set(this, false);
    inProgress.set(this, true);
    this.startedAt = new Date();
    timeId.set(this, setTimeout(this.tick, this.timer, this));
  }

  tick(self) {
    if (self.timeId) clearTimeout(self.timeId);
    self.verifyTime();
		if (self.isAborted)  {
			const callback = CALLBACK.get(self);
			const arg = ARG.get(self);
			return callback(arg);
		}
    const now = new Date().valueOf();
    const limit = new Date(self.lastUpdate);
    limit.setMilliseconds(self.lastUpdate.getMilliseconds() + self.timer);
    let nextTick = limit.valueOf() - now;
    if (self.inProgress)
      if (nextTick <= 0) self.tick(self, callback, arg);
      else timeId.set(this, setTimeout(self.tick, nextTick, self, callback, arg));
  }

  verifyTime() {
    const now = new Date();
    const nowValue = now.valueOf();
    const limit = new Date(this.lastUpdate);
    limit.setMilliseconds(this.lastUpdate.getMilliseconds() + this.timer);
    const limitValue = limit.valueOf();
    if (nowValue >= limitValue) this.abort();
  }

  launchTimerPromise(promise, arg) {
		const self = this;
		if (promise instanceof Promise) return promise;
    return new Promise((resolve, reject) => {
      self.launchTimer(reject, arg);
      promise
        .then((data) => {
          self.done();
          resolve(data);
        })
        .catch((error) => {
          self.abort();
          reject(error);
        });
    });
  }
};

// export default Timer;
module.exports = Timer;
