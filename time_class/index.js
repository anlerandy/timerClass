const { initLogger, isFunction, validateId, raiseError } = require('./helpers');

const ALREADYRUN = 'Timer already launched.';
const THREADSCOPE = 'Unexpected launch of timer.';
const BEINGDELETE = 'Timer is being deleted.';

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

/**
 * Timer Class
 * @summary Timeout manager for sensible process.
 * @class
 * 
 * Manage time limit of a task/process/function and run a callback upon timeout.
 * Instances can be save inside the Class and retrieved throughout an app.
 * @see {@link https://github.com/anlerandy/timerClass#readme README} 
 * @author anlerandy
 */
class Timer {
   /** 
   * @param {number} [time=120000] - The time in millisecond before timer termination.
   * @param {object} [options] - Options of the timer.
   * @param {string|number} [options.id] - Identify the instance.
   * @param {boolean} [options.forceCreate=false] - Force creation.
   * @param {boolean} [options.save=true] - Save the instance in the Class.
   * @param {boolean} [options.destroy=true] - Destroy the instance after termination.
   * 
   * @throws If options.id is already used or invalid and forceCreate is false.
   */
  constructor(time, options = {}) {
    const { forceCreate, save = true, destroy = true, verbose = 0, log = console.log } = options;
    let { id } = options;
    if (!isFunction(log)) throw new TypeError('The passed log is not a function.');

    try {
      id = getId(id);
      if (!id) {
        raiseError('Timer already exist. To retrieve the existing one, please use `getById` Method.');
      }
    } catch (e) {
      if (!forceCreate) {
        throw e;
      }
      id = getId();
    }

    _id.set(this, id);
    if (save) {
      TIMERS.set(Timer, { ...TIMERS.get(Timer), [this._id]: this });
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

  /**
   * How much time in millisecond to wait before termination.
   * @public
   * @instance
   * @type {number}
   */
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

  /**
   * Instance identifier.
   * @readonly
   * @instance
   * @type {number|string}
   */
  get _id() {
    return _id.get(this);
  }

  /**
   * Creation Date of the instance.
   * @readonly
   * @instance
   * @type {Date}
   */
  get createdAt() {
    return createdAt.get(this);
  }

  /**
   * Last started Date of the instance's clock.
   * @readonly
   * @instance
   * @type {Date}
   */
  get startedAt() {
    return startedAt.get(this);
  }

  /**
   * Last update Date of the instance clock.
   * @readonly
   * @instance
   * @type {Date}
   */
  get lastUpdate() {
    return lastUpdate.get(this);
  }

  /**
   * Instance running state.
   * @readonly
   * @instance
   * @type {boolean}
   */
  get inProgress() {
    return inProgress.get(this);
  }

  get _timeId() {
    return _timeId.get(this);
  }

  /**
   * Instance abortion state.
   * @readonly
   * @instance
   * @type {boolean}
   */
  get isAborted() {
    return aborted.get(this);
  }

  get isSelfAborted() {
    return outed.get(this);
  }

  /**
   * Destroy the instance if it's not running.
   * @instance
   * @function destroy
   * @throws If timer is currently running
   */
  destroy() {
    if (!(this || {})._id) return;
    if (this.inProgress && !this.aborted)
      raiseError('Please abort() or done() the Timer before destroying it.');
    const { [this._id]: timer, ...others } = TIMERS.get(Timer);
    TIMERS.set(Timer, others);
    _ALL.map(el => el.delete(this));
  }

  /**
   * Stop the clock of a timer.
   * @instance
   * @function done
   */
  done(...log) {
    if (!(this || {}).inProgress) return;
    inProgress.set(this, false);
    clearTimeout(this._timeId);
    if (!this.isAborted) _log.get(this).done(...log);
    if (_destroy.get(this)) this.destroy();
  }

  /**
   * Stop the clock of the timer after running the callback or rejecting its promise.
   * If instance promise is not in a try/catch environment, the app can crash.
   * @instance
   * @function abort
   */
  abort(...log) {
    if (!(this || {}).inProgress) return;
    aborted.set(this, true);
    const callback = _callback.get(this);
    const arg = _arg.get(this);
    _log.get(this).abort(...log);
    callback(arg);
    this.done();
  }

  /**
   * Reset clock of the timer instance, postponing the timeout.
   * @instance
   * @function update
   */
  update(...log) {
    if (!(this || {}).inProgress) return;
    lastUpdate.set(this, new Date());
    _log.get(this).update(...log);
  }

  /**
   * Launch the clock of the instance.
   * @instance
   * @function launchTimer
   * @param {function|Promise} callback - Function to call (or Promise to reject) upon termination.
   * @param {any} [arg] - Parameters to pass to the callback.
   * @return {(undefined|Promise)} If callback is a Promise, the method return a Promise.
   * @throws If timer is already launched.
   * @throws If instance has been destroyed.
   * @throws If callback is invalid or missing.
   */
  launchTimer(callback, arg = 'TimeOut', ...log) {
    if (!this) raiseError(THREADSCOPE);
    if (this.inProgress) raiseError(ALREADYRUN);
    if (!this._id) raiseError(BEINGDELETE);
    if (callback instanceof Promise) return this.launchTimerPromise(callback, arg, ...log);
    if (!callback || !isFunction(callback))
      throw new TypeError(callback ? 'The passed callback is not a function.' : 'Callback is required.');
    _callback.set(this, callback);
    _arg.set(this, arg);
    aborted.set(this, false);
    outed.set(this, false);
    inProgress.set(this, true);
    startedAt.set(this, new Date());
    _timeId.set(this, setTimeout(this._tick, this._time, this));
    _log.get(this).launch(...log);
  }

  _tick(self) {
    if (!(self instanceof Timer)) raiseError('Tick is being called without instance of Timer.');
    clearTimeout(self._timeId);
    verifyTime(self);
    if (self.inProgress) {
      const nextTick = (self.lastUpdate.valueOf() + self._time) - new Date().valueOf();
      _timeId.set(this, setTimeout(self._tick, nextTick, self));
    }
  }

  _log(...args) {
    if (!this._id) raiseError(BEINGDELETE);
    _log.get(this).log(...args);
  }

  /**
   * Launch the clock of the instance.
   * @instance
   * @async
   * @function launchTimerPromise
   * @param {Promise} promise - Promise to await.
   * @param {any} [arg] - Parameters to pass to the promise.reject.
   * @return {Promise} Return a promise that wraps the one passed.
   * @throws If timer is already launched.
   * @throws If instance has been destroyed.
   * @throws If promise is invalid or missing.
   */
  async launchTimerPromise(promise, arg, ...log) {
    if (!this) raiseError(THREADSCOPE);
    if (this.inProgress) raiseError(ALREADYRUN);
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

  /**
   * Retrieve a timer instance by its id. Can create one if none were found.
   * @static
   * @function getById
   * @param {number|string} id - Identifier of the instance to get or create.
   * @param {object} [options] - See {@link Timer} options property for other options.
   * @param {boolean} [options.createOne] - Create an instance if none were found. No other options matter if false.
   * @param {number} [options.time] - The time in millisecond before timer termination for a new instance.
   * @return {Timer|undefined} Return timer instance or undefined.
   */
  static getById(id, options) { return getTimerById(id, options) };

  /**
   * Retrieve all timer instances.
   * @static
   * @function getAll
   * @return {Array<Timer>} Always return an Array.
   */
  static getAll() { return Object.values(TIMERS.get(Timer)) };

  /**
   * Destroys all instances saved in Class. Can force termination before destroy.
   * @static
   * @function destroyAll
   * @param {boolean} force - Determines if method should force termination.
   */
  static destroyAll(force) { destroyAll(force) };
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
