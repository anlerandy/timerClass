const SECOND = 1000;
const MINUTE = 60 * SECOND;

const Timer = class {
  constructor(timer) {
    this.lastUpdate = new Date();
    this.createdAt = new Date();
    this.startedAt;
    this.aborted = false;
    this.inProgress = false;
    this.timer = timer || 2 * MINUTE;
    this.timeId;
  }

  done() {
    this.inProgress = false;
    if (this.timeId) clearTimeout(this.timeId);
  }

  abort() {
    this.aborted = true;
    this.done();
  }

  update() {
    this.lastUpdate = new Date();
  }

  launchTimer(callback, arg) {
    if (callback && {}.toString.call(callback) !== '[object Function]')
      throw new Error('The passed callback is not a function.');
    if (this.inProgress) throw new Error('Timer already launched.');
    this.aborted = false;
    this.inProgress = true;
    this.startedAt = new Date();
    this.timeId = setTimeout(this.tick, this.timer, this, callback, arg);
  }

  tick(self, callback, arg = 'TimeOut') {
    if (self.timeId) clearTimeout(self.timeId);
    self.verifyTime();
    if (self.aborted && {}.toString.call(callback) === '[object Function]') callback(arg);
    const now = new Date().valueOf();
    const limit = new Date(self.lastUpdate);
    limit.setMilliseconds(self.lastUpdate.getMilliseconds() + self.timer);
    const nextTick = limit - now;
    if (self.inProgress) self.timeId = setTimeout(self.tick, nextTick, self, callback, arg);
  }

  verifyTime() {
    const now = new Date();
    const nowValue = now.valueOf();
    const limit = new Date(this.lastUpdate);
    limit.setMilliseconds(this.lastUpdate.getMilliseconds() + this.timer);
    const limitValue = limit.valueOf();
    if (nowValue >= limitValue) this.abort();
  }

  isAborted() {
    return this.aborted;
  }

  launchTimerPromise(promise, arg) {
    const self = this;
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

export default Timer;
