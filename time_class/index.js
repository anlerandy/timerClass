const { initLogger, isFunction, validateId } = require('./helpers');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const MARGIN = 100;

const _ALL = new Array(13).fill(undefined).map(_ => new WeakMap());
const [
  createdAt,
  startedAt,
  aborted,
  outed,
  lastUpdate,
  inProgress,
  _destroy,
  _timeId,
  _id,
  _callback,
  _arg,
  _log,
  _timestamp
] = _ALL;

const TIMERS = new WeakMap();

const Timer = class {
  constructor(time, options = {}) {
    const { forceCreate, save = true, destroy = true, verbose = 0, log = console.log } = options;
    let { id } = options;
    if (!isFunction(log)) throw new TypeError('The passed log is not a function.');

    try {
      id = getId(id);
      if (!id)
        throw new Error('Timer already exist. To retrieve the existing one, please use `getById` Method.');
    } catch (e) {
      if (!forceCreate) throw e;
      id = getId();
    }

    _id.set(this, id);
    if (save) TIMERS.set(Timer, { ...TIMERS.get(Timer), [this._id]: this });

    lastUpdate.set(this, new Date());
    createdAt.set(this, new Date());
    aborted.set(this, false);
    outed.set(this, false);
    inProgress.set(this, false);
    _destroy.set(this, destroy);
    _log.set(this, initLogger(log, parseInt(verbose), this));
    this.time = (time || 2 * MINUTE);
  }

  set time(timestamp) {
    const parsedTime = parseInt(timestamp);
    if (!this._id || `${parsedTime}` !== `${timestamp}`) return;
    _timestamp.set(this, parsedTime + MARGIN);
    this._tick(this);
  }

  get time() {
    if (!this._id) return;
    return _timestamp.get(this) - MARGIN;
  }

  get _time() {
    return _timestamp.get(this);
  }

  get _id() {
    return _id.get(this);
  }

  get createdAt() {
    return createdAt.get(this);
  }

  get startedAt() {
    return startedAt.get(this);
  }

  get lastUpdate() {
    return lastUpdate.get(this);
  }

  get inProgress() {
    return inProgress.get(this);
  }

  get _timeId() {
    return _timeId.get(this);
  }

  get isAborted() {
    return aborted.get(this);
  }

  get isSelfAborted() {
    return outed.get(this);
  }

  destroy() {
    if (!this._id) return;
    if (this.inProgress && !this.aborted)
      throw new Error('Please abort() or done() the Timer before destroying it.');
    const { [this._id]: timer, ...others } = TIMERS.get(Timer);
    TIMERS.set(Timer, others);
    _ALL.map(el => el.delete(this));
  }

  done(...log) {
    if (!this.inProgress) return;
    inProgress.set(this, false);
    clearTimeout(this._timeId);
    if (!this.isAborted) _log.get(this).done(...log);
    if (_destroy.get(this)) this.destroy();
  }

  abort(...log) {
    if (!this.inProgress) return;
    aborted.set(this, true);
    const callback = _callback.get(this);
    const arg = _arg.get(this);
    _log.get(this).abort(...log);
    callback(arg);
    this.done();
  }

  update(...log) {
    if (!this._id) return;
    lastUpdate.set(this, new Date());
    _log.get(this).update(...log);
  }

  launchTimer(callback, arg = 'TimeOut', ...log) {
    if (this.inProgress) throw new Error('Timer already launched.');
    if (!this._id) throw new Error('Timer is being deleted.');
    if (callback instanceof Promise) return this.launchTimerPromise(callback, arg, ...log);
    if (!callback || !isFunction(callback))
      throw new TypeError(callback ? 'The passed callback is not a function.' : 'Callback is required.');
    _callback.set(this, callback);
    _arg.set(this, arg);
    aborted.set(this, false);
    outed.set(this, false);
    inProgress.set(this, true);
    startedAt.set(this, new Date());
    _timeId.set(this, setTimeout(this._tick, this.time, this));
    _log.get(this).launch(...log);
  }

  _tick(self) {
    if (!(self instanceof Timer)) throw new Error('Tick is being call without instance of Timer.');
    clearTimeout(self._timeId);
    verifyTime(self);
    if (self.inProgress) {
      const nextTick = (self.lastUpdate.valueOf() + self._time) - new Date().valueOf();
      _timeId.set(this, setTimeout(self._tick, nextTick, self));
    }
  }

  _log(...args) {
    if (!this._id) throw new Error('The timer is being destroyed. No log possible.');
    _log.get(this).log(...args);
  }

  async launchTimerPromise(promise, arg, ...log) {
    if (this.inProgress) throw new Error('Timer already launched.');
    if (!(promise instanceof Promise)) throw new TypeError('`First argument` must be a Promise.');
    const self = this;
    const timerPromise = new Promise((_, reject) => self.launchTimer(reject, arg, ...log));
    try {
      const result = await Promise.race([promise, timerPromise]);
      this.done();
      return result;
    } catch (e) {
      this.abort();
      throw e;
    }
  }
  static getById = getTimerById;
  static getAll = () => Object.values(TIMERS.get(Timer));
  static destroyAll = destroyAll;
};

function verifyTime(timer) {
  if (timer.isAborted || !timer.inProgress) return;
  const now = new Date().valueOf();
  const limit = timer.lastUpdate.valueOf() + timer._time;
  if (now >= limit) {
    outed.set(timer, true);
    timer.abort();
  }
}

function getId(id){
  const timers = TIMERS.get(Timer);
  if (id) {
    validateId(id);
    if (!timers[id]) return id;
    else return;
  }
  id = 1;
  while (timers[id]) ++id;
  return id;
}

function getTimerById(id, options = {}) {
  const { createOne = true, time } = options;
  validateId(id);
  const timers = TIMERS.get(Timer);
  const timer = timers[id];
  if (!timer && createOne) return new Timer(time, { ...options, id });
  return timer;
}

function destroyAll(force = false) {
  Timer.getAll().map(timer => {
    if (force) timer.abort();
    try {
      timer.destroy();
    } catch (_) {}
  });
}

TIMERS.set(Timer, {});

module.exports = Timer;
