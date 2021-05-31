const { initLogger, isFunction, validateId, raiseError } = require('./helpers');

module.exports = Timer;

Timer.prototype.setTime = setTime;
Timer.prototype.getTime = getTime;
Timer.prototype._getTime = _getTime;
Timer.prototype.getId = getId;
Timer.prototype.getCreatedAt = getCreatedAt;
Timer.prototype.getStartedAt = getStartedAt;
Timer.prototype.getLastUpdate = getLastUpdate;
Timer.prototype.getInProgress = getInProgress;
Timer.prototype.getTimeId = getTimeId;
Timer.prototype.getIsAborted = getIsAborted;
Timer.prototype.getIsSelfAborted = getIsSelfAborted;
Timer.prototype.destroy = destroy;
Timer.prototype.done = done;
Timer.prototype.abort = abort;
Timer.prototype.update = update;
Timer.prototype.launchTimer = launchTimer;
Timer.prototype._tick = _tick;
Timer.prototype._log = log;
Timer.prototype.launchTimerPromise = launchTimerPromise;
Timer.getById = getTimerById;
Timer.getAll = getAll;
Timer.destroyAll = destroyAll;

const ALREADYRUN = 'Timer already launched.';
const THREADSCOPE = 'Unexpected launch of timer.';
const BEINGDELETE = 'Timer is being deleted.';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const MARGIN = 100;

const _ALL = new Array(14).fill(undefined).map(_ => new WeakMap());
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
 * 
 * @param {number} [time=120000] - The time in millisecond before timer termination.
 * @param {object} [options] - Options of the timer.
 * @param {string|number} [options.id] - Identify the instance.
 * @param {boolean} [options.forceCreate=false] - Force creation.
 * @param {boolean} [options.save=true] - Save the instance in the Class.
 * @param {boolean} [options.destroy=true] - Destroy the instance after termination.
 * 
 * @throws If options.id is already used or invalid and forceCreate is false.
 */
function Timer(time, options = {}) {
  const { forceCreate, save = true, destroy = true, verbose = 0, log = console.log } = options;
  let { id } = options;
  if (!isFunction(log)) throw new TypeError('The passed log is not a function.');

  try {
    id = validateOrGetId(id);
    if (!id) {
      raiseError('Timer already exist. To retrieve the existing one, please use `getById` Method.');
    }
  } catch (e) {
    if (!forceCreate) {
      throw e;
    }
    id = validateOrGetId();
  }

  _id.set(this, id);
  if (save) {
    TIMERS.set(Timer, { ...TIMERS.get(Timer), [this.getId()]: this });
  }

  lastUpdate.set(this, new Date());
  createdAt.set(this, new Date());
  aborted.set(this, false);
  outed.set(this, false);
  inProgress.set(this, false);
  _destroy.set(this, destroy);
  _log.set(this, initLogger(log, parseInt(verbose), this));
  return this.setTime(time || 2 * MINUTE);
}

/**
 * How much time in millisecond to wait before termination.
 * @public
 * @instance Timer
 * @type {number}
 * @param {number} timestamp
 */
function setTime(timestamp) {
  const parsedTime = parseInt(timestamp);
  if (!this.getId?.() || `${parsedTime}` !== `${timestamp}`) return this;
  _timestamp.set(this, parsedTime + MARGIN);
  this._tick(this);
  return this;
}

function getTime() {
  if (!(this instanceof Timer) || !this.getId()) return;
  return _timestamp.get(this) - MARGIN;
}

function _getTime() {
  return _timestamp.get(this);
}

/**
 * Instance identifier.
 * @readonly
 * @instance
 * @type {number|string}
 * @returns {string} The id of the instance.
 */
function getId() {
  return _id.get(this);
}


/**
 * Creation Date of the instance.
 * @readonly
 * @instance
 * @type {Date}
 * @returns {Date} The creation date of the instance.
 */
function getCreatedAt() {
  return createdAt.get(this);
}

/**
 * Last started Date of the instance's clock.
 * @readonly
 * @instance
 * @type {Date}
 * @returns {Date} The started date of the instance.
 */
function getStartedAt() {
  return startedAt.get(this);
}

/**
 * Last update Date of the instance clock.
 * @readonly
 * @instance
 * @type {Date}
 * @returns {Date} The updated date of the instance.
 */
function getLastUpdate() {
  return lastUpdate.get(this);
}

/**
 * Instance running state.
 * @readonly
 * @instance
 * @type {boolean}
 * @returns {boolean} In progress boolean status.
 */
function getInProgress() {
  return inProgress.get(this);
}

function getTimeId() {
  return _timeId.get(this);
}

/**
 * Instance abortion state.
 * @readonly
 * @instance
 * @type {boolean}
 * @returns {boolean} Aborted boolean status.
 */
function getIsAborted() {
  return aborted.get(this);
}

function getIsSelfAborted() {
  return outed.get(this);
}


/**
 * Destroy the instance if it's not running.
 * @instance
 * @function destroy
 * @throws If timer is currently running
 */
function destroy() {
  if (!(this instanceof Timer) || !this.getId()) return;
  if (this.getInProgress() && !this.getIsAborted())
    raiseError('Please abort() or done() the Timer before destroying it.');
  const { [this.getId()]: timer, ...others } = TIMERS.get(Timer);
  TIMERS.set(Timer, others);
  _ALL.map(el => el.delete(this));
}

/**
 * Stop the clock of a timer.
 * @instance
 * @function done
 */
function done(...log) {
  if (!(this instanceof Timer) || !this.getInProgress()) return;
  inProgress.set(this, false);
  clearTimeout(this.getTimeId());
  if (!this.getIsAborted()) _log.get(this).done(...log);
  if (_destroy.get(this)) this.destroy();
}

/**
 * Stop the clock of the timer after running the callback or rejecting its promise.
 * If instance promise is not in a try/catch environment, the app can crash.
 * @instance
 * @function abort
 */
function abort(...log) {
  if (!(this instanceof Timer) || !this.getInProgress()) return;
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
function update(...log) {
  if (!(this instanceof Timer) || !this.getInProgress()) return;
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
function launchTimer(callback, arg = 'TimeOut', ...log) {
  if (!(this instanceof Timer)) raiseError(THREADSCOPE);
  if (this.getInProgress()) raiseError(ALREADYRUN);
  if (!this.getId()) raiseError(BEINGDELETE);
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

function _tick(self) {
  if (!(self instanceof Timer)) raiseError('Tick is being called without instance of Timer.');
  clearTimeout(self.getTimeId());
  verifyTime(self);
  if (self.getInProgress()) {
    const nextTick = (self.getLastUpdate().valueOf() + self._getTime()) - new Date().valueOf();
    _timeId.set(this, setTimeout(self._tick, nextTick, self));
  }
}

function log(...args) {
  if (!this.getId()) raiseError(BEINGDELETE);
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
async function launchTimerPromise(promise, arg, ...log) {
  if (!(this  instanceof Timer)) raiseError(THREADSCOPE);
  if (this.getInProgress()) raiseError(ALREADYRUN);
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

// Statics

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
function getTimerById(id, options = {}) {
  const { createOne = true, time } = options;
  validateId(id);
  const timers = TIMERS.get(Timer);
  const timer = timers[id];
  if (!timer && createOne) return new Timer(time, { ...options, id });
  return timer;
}

/**
 * Destroys all instances saved in Class. Can force termination before destroy.
 * @static
 * @function destroyAll
 * @param {boolean} force - Determines if method should force termination.
 */
function destroyAll(force = false) {
  Timer.getAll().map(timer => {
    if (force) timer.abort();
    try {
      timer.destroy();
    } catch (_) {}
  });
}

/**
 * Retrieve all timer instances.
 * @static
 * @function getAll
 * @return {Array<Timer>} Always return an Array.
 */
function getAll() { return Object.values(TIMERS.get(Timer)) };

TIMERS.set(Timer, {});

function verifyTime(timer) {
  if (timer.getIsAborted() || !timer.getInProgress()) return;
  const now = new Date().valueOf();
  const limit = timer.getLastUpdate().valueOf() + timer._getTime();
  if (now >= limit) {
    outed.set(timer, true);
    timer.abort();
  }
}

function validateOrGetId(id){
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
