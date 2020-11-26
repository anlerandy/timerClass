const initLogger = require('./helpers/log');
const validateId = require('./helpers/id');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const MARGIN = 100; // The margin is a timestamp preventing rejection due to initialisation/launch time.

const createdAt = new WeakMap();
const startedAt = new WeakMap();
const aborted = new WeakMap();
const outed = new WeakMap();
const lastUpdate = new WeakMap();
const inProgress = new WeakMap();
const _destroy = new WeakMap();
const _timeId = new WeakMap();
const _id = new WeakMap();
const _callback = new WeakMap();
// const _arg = new WeakMap();
const TIMERS = new WeakMap();
const _log = new WeakMap();
const _timestamp = new WeakMap();
const _finisher = new WeakMap();

const Timer = class {
  constructor(time, options = {}) {
    const { forceCreate, save = true, destroy = true, verbose = 0, log = console.log } = options;
    let { id } = options;
    if ({}.toString.call(log) !== '[object Function]')
      throw new TypeError('The passed log is not a function.');

    try {
      id = getId(id);
    } catch (e) {
      if (!forceCreate) throw e;
      id = undefined;
    }
    if (!id && forceCreate) id = getId();

    _id.set(this, id);
    if (id) {
      if (save) saveTimer(this);
    }
    else {
      _id.delete(this);
      throw new Error('Timer already exist. To retrieve the existing one, please use `getById` Method.');
    }

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
    if (!this._id) return;
    const time = parseInt(timestamp);
    if (time) _timestamp.set(this, parseInt(timestamp) + MARGIN);
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
    createdAt.delete(this);
    startedAt.delete(this);
    lastUpdate.delete(this);
    inProgress.delete(this);
    aborted.delete(this);
    outed.delete(this);
    _destroy.delete(this);
    _timeId.delete(this);
    _callback.delete(this);
    // _arg.delete(this);
    _log.delete(this);
    _timestamp.delete(this);
    _finisher.delete(this);
    const timers = TIMERS.get(Timer);
    if (timers[this._id]) {
      const { [this._id]: timer, ...others } = timers;
      TIMERS.set(Timer, others);
    }
    _id.delete(this);
    return null;
  }

  done(...log) {
    if (!this.inProgress) return;
    inProgress.set(this, false);
    clearTime(this);
    if (!this.isAborted) _log.get(this).done(...log);
    _finisher.get(this)?.();
    if (_destroy.get(this)) this.destroy();
  }

  abort(...log) {
    if (!this.inProgress) return;
    aborted.set(this, true);
    const callback = _callback.get(this);
    // const arg = _arg.get(this);
    _log.get(this).abort(...log);
    callback(/* arg */);
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
    if (callback && {}.toString.call(callback) !== '[object Function]')
      throw new TypeError('The passed callback is not a function.');
    // _callback.set(this, callback);
    // _arg.set(this, arg);
    aborted.set(this, false);
    outed.set(this, false);
    inProgress.set(this, true);
    startedAt.set(this, new Date());
    _timeId.set(this, setTimeout(this._tick, this.time, this));
    _log.get(this).launch(...log);
    const promise = new Promise((resolve, reject) => {
      const newCallback = _ => {
        if (callback) callback(arg);
        reject(arg);
      };
      const finisher = _ => resolve({ status: 'Done' });
      _callback.set(this, newCallback);
      _finisher.set(this, finisher);
    });
    return promise;
  }

  _tick(self) {
    if (!(self instanceof Timer)) throw new Error('Tick is being call without instance of Timer.');
    clearTime(self);
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
    const timerPromise = this.launchTimer(undefined, arg, ...log);
    try {
      const value = await Promise.race([promise, timerPromise]);
      this.done();
      return { status: 'Done', value };
    } catch (error) {
      this.abort();
      throw { status: this.isSelfAborted ? 'Timeout' : 'Aborted', message: error?.message || error };
    }
  }
  static getById = getTimerById;
  static getAll = getAll;
  static destroyAll = destroyAll;
};

function clearTime(timer) {
  clearTimeout(timer._timeId);
  _timeId.set(timer, undefined);
}

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
    if (!timers[id]) return id
    else return;
  }
  id = 1;
  while (timers[id]) ++id;
  return id;
}

function saveTimer(timer) {
  const timers = TIMERS.get(Timer);
  TIMERS.set(Timer, { ...timers, [timer._id]: timer });
}

function getTimerById(id, options = {}) {
  const { createOne = true, time } = options;
  validateId(id);
  const timers = TIMERS.get(Timer);
  const timer = timers?.[id];
  if (!timer && createOne) return new Timer(time, { ...options, id });
  return timer;
}

function getAll() {
  return Object.values(TIMERS.get(Timer));
}

function destroyAll(force = false) {
  getAll().map(timer => {
    if (force) timer.abort();
    try {
      timer.destroy();
    } catch (_) {}
  });
}

TIMERS.set(Timer, {});

module.exports = Timer;
