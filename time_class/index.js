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

const Timer = class {
  constructor(timer, options = {}) {
		const { forceCreate, save = true, destroy = true, verbose = 0 } = options;
		let { id } = options;
		lastUpdate.set(this, new Date());
		createdAt.set(this, new Date());
    aborted.set(this, false);
		inProgress.set(this, false);
		_destroy.set(this, destroy)
		this.timer = (timer || 2 * MINUTE) + MARGIN;
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
		else throw new Error('Timer already exist. To retrieve the existing one, please use `getById` Method.');
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
		const isDestroyed = _destroy.get(this);
		const isAborted = aborted.get(this);
		aborted.delete(this);
		_destroy.delete(this);
		if (isDestroyed && isAborted) {
			const callback = _callback.get(this);
			const arg = _arg.get(this);
			if (callback) callback(arg);
		}
		_callback.delete(this);
		_arg.delete(this);
		const timers = TIMERS.get(Timer);
		if (timers) {
			const { [this._id]: timer, ...others } = timers;
			TIMERS.set(Timer, others);
		}
		_id.delete(this);
		return null;
	}

  done() {
		if (!this._id) return;
    inProgress.set(this, false);
		if (this._timeId) {
			clearTimeout(this._timeId);
			_timeId.set(this, undefined);
		}
		if (_destroy.get(this)) this.destroy();
  }

  abort() {
		if (!this._id) return;
    aborted.set(this, true);
    this.done();
  }

  update() {
		if (!this._id) return;
    lastUpdate.set(this, new Date());
  }

  launchTimer(callback, arg = 'TimeOut') {
		if (this.inProgress) throw new Error('Timer already launched.');
		if (!this._id) throw new Error('Timer is being deleted.');
    if (callback instanceof Promise) return this.launchTimerPromise(callback, arg);
    if (callback && {}.toString.call(callback) !== '[object Function]')
			throw new TypeError('The passed callback is not a function.');
		_callback.set(this, callback);
		_arg.set(this, arg);
    aborted.set(this, false);
    inProgress.set(this, true);
    startedAt.set(this, new Date());
    _timeId.set(this, setTimeout(this._tick, this.timer, this));
  }

  _tick(self) {
		if (!self instanceof Timer) throw new Error('Tick is being call without instance of Timer.');
		if (self._timeId) clearTimeout(self._timeId);
    verifyTime(self);
		const callback = _callback.get(self);
		const arg = _arg.get(self);
		if (self.isAborted) return callback ? callback(arg) : arg;
    if (self.inProgress && self._id) {
			const now = new Date().valueOf();
			const limit = new Date(self.lastUpdate);
			limit.setMilliseconds(self.lastUpdate.getMilliseconds() + self.timer);
			let nextTick = limit.valueOf() - now;
      if (nextTick <= 0) self._tick(self);
      else _timeId.set(this, setTimeout(self._tick, nextTick, self));
		}
  }

  launchTimerPromise(promise, arg) {
		if (this.inProgress) throw new Error('Timer already launched.');
		if (!(promise instanceof Promise)) throw new TypeError('`First argument` must be a Promise.');
		const self = this;
		const timerPromise = new Promise((_, reject) =>  self.launchTimer(reject, arg));
		return Promise.race([promise, timerPromise]);
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
	if (!timers) return id || 1;
	const ids = Object.keys(timers);
	if (id) 
		if (!ids.includes(`${id}`)) return id
		else return;
	id = 1;
	while (ids.includes(`${id}`)) ++id;
	return id;
}

function saveTimer(timer) {
	const timers = TIMERS.get(Timer) || {};
	TIMERS.set(Timer, { ...timers, [timer._id]: timer });
}

function validateId(id) { 
	if (typeof id !== 'string' && typeof id !== 'number') throw new TypeError('`_id` must be a String or a Number.');
	if (!id) throw new TypeError('`_id` must not be an empty String or equal to 0.');
}

function getTimerById(id, options = {}) {
	const { createOne = true, time } = options;
	validateId(id);
	const timers = TIMERS.get(Timer) || {};
	const timer = timers[id];
	if (!timer && createOne) return new Timer(time, { ...options, id });
	return timer;
}

Timer.getById = getTimerById;

Object.freeze(Timer);

module.exports = Timer;
