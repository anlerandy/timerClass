const initLogger = require('./helpers/log');
const validateId = require('./helpers/id');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
// The margin is a timestamp preventing rejection due to initialisation/launch time.
const MARGIN = 100;

const createdAt = new WeakMap();
const startedAt = new WeakMap();
const aborted = new WeakMap();
const lastUpdate = new WeakMap();
const inProgress = new WeakMap();
const _destroy = new WeakMap();
const _timeId = new WeakMap();
const _id = new WeakMap();
const _callback = new WeakMap();
const _arg = new WeakMap();
const TIMERS = new WeakMap();
const _log = new WeakMap();

const Timer = class {
  constructor(timer, options = {}) {
		if (!TIMERS.get(Timer)) TIMERS.set(Timer, {});
		const { forceCreate, save = true, destroy = true, verbose = 0, log = console.log } = options;
		let { id } = options;
    if ({}.toString.call(log, verbose) !== '[object Function]')
			throw new TypeError('The passed log is not a function.');

		try {
			id = getId(id) 
		} catch (e) {
			if (!forceCreate) throw e;
			id = undefined;
		}
		if (!id && forceCreate) id = getId();

		_id.set(this, id); 
		if (id)  {
			if (save) saveTimer(this);
		}
		else {
			_id.delete(this);
			throw new Error('Timer already exist. To retrieve the existing one, please use `getById` Method.');
		}

		lastUpdate.set(this, new Date());
		createdAt.set(this, new Date());
    aborted.set(this, false);
		inProgress.set(this, false);
		_destroy.set(this, destroy);
		_log.set(this, initLogger(log, verbose, this));
		this.timer = (timer || 2 * MINUTE) + MARGIN;
		Object.freeze(this);
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
	
	destroy() {
		if (!this._id) return;
		if (this.inProgress && !this.aborted)
			throw new Error('Please abort() or done() the Timer before destroying it.');
		createdAt.delete(this);
		startedAt.delete(this);
		lastUpdate.delete(this);
		inProgress.delete(this);
		_timeId.delete(this);
		aborted.delete(this);
		_destroy.delete(this);
		_callback.delete(this);
		_arg.delete(this);
		_log.delete(this);
		const timers = TIMERS.get(Timer);
		if (timers[this._id]) {
			const { [this._id]: timer, ...others } = timers;
			TIMERS.set(Timer, others);
		}
		_id.delete(this);
		return null;
	}

  done(...log) {
		if (!this._id) return;
    inProgress.set(this, false);
		if (this._timeId) {
			clearTimeout(this._timeId);
			_timeId.set(this, undefined);
		}
		_log.get(this).done(...log);
		if (_destroy.get(this)) this.destroy();
  }

  abort(...log) {
		if (!this._id) return;
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
    if (!callback || {}.toString.call(callback) !== '[object Function]')
			throw new TypeError(callback ? 'The passed callback is not a function.' : 'Callback is required.');
		_callback.set(this, callback);
		_arg.set(this, arg);
    aborted.set(this, false);
    inProgress.set(this, true);
    startedAt.set(this, new Date());
		_timeId.set(this, setTimeout(this._tick, this.timer, this));
		_log.get(this).launch(...log);
  }

  _tick(self) {
		if (!(self instanceof Timer)) throw new Error('Tick is being call without instance of Timer.');
		if (self._timeId) clearTimeout(self._timeId);
    verifyTime(self);
    if (self.inProgress && self._id) {
			const now = new Date().valueOf();
			const limit = new Date(self.lastUpdate);
			limit.setMilliseconds(self.lastUpdate.getMilliseconds() + self.timer);
			let nextTick = limit.valueOf() - now;
      _timeId.set(this, setTimeout(self._tick, nextTick, self));
		}
  }

  async launchTimerPromise(promise, arg, ...log) {
		if (this.inProgress) throw new Error('Timer already launched.');
		if (!(promise instanceof Promise)) throw new TypeError('`First argument` must be a Promise.');
		const self = this;
		const timerPromise = new Promise((_, reject) =>  self.launchTimer(reject, arg, ...log));
		return await Promise.race([promise, timerPromise]);
  }
};

function verifyTime(self) {
	if (self.isAborted || !self.inProgress) return;
  const now = new Date();
  const nowValue = now.valueOf();
  const limit = new Date(self.lastUpdate);
  limit.setMilliseconds(self.lastUpdate.getMilliseconds() + self.timer);
  const limitValue = limit.valueOf();
  if (nowValue >= limitValue) self.abort();
}


function getId(id){
	if (id) validateId(id);
	const timers = TIMERS.get(Timer);
	if (id) 
		if (!timers[id]) return id
		else return;
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
	const timer = timers[id];
	if (!timer && createOne) return new Timer(time, { ...options, id });
	return timer;
}

function getAll() {
	return Object.values(TIMERS.get(Timer));
}

function destroyAll(force = false) {
	const timers = getAll();
	timers.map(timer => {
		const { inProgress, _id } = timer;
		if (force && inProgress && _id) timer.abort();
		try {
			timer.destroy();
		} catch (_) {}
	});
}

Timer.getById = getTimerById;

Timer.getAll = getAll;

Timer.destroyAll = destroyAll;

Object.freeze(Timer);

module.exports = Timer;
