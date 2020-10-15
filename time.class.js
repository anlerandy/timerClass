const SECOND = 1000;
const MINUTE = 60 * SECOND;

const createdAt = new WeakMap();
const startedAt = new WeakMap();
const aborted = new WeakMap();
const lastUpdate = new WeakMap();
const inProgress = new WeakMap();
const timeId = new WeakMap();
const _id = new WeakMap();
const _callback = new WeakMap();
const _arg = new WeakMap();
const TIMERS = new WeakMap();

const Timer = class {
  constructor(timer, options = {}) {
		const { id, forceCreate, save = true, destroy = true } = options;
    lastUpdate.set(this, new Date());
    createdAt.set(this, new Date());
    aborted.set(this, false);
    inProgress.set(this, false);
		this.timer = timer || 2 * MINUTE;

		try { id = getId(id) } catch (e) {}
		if (!id && forceCreate) id = getId();
		_id.set(this, id); 

		if (id)  {
			if (save) saveTimer(this);
		}
		else throw new Error('Timer already exist. Please use `getById` Method.');
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
		if (this.inProgress) throw new Error('Timer already launched.');
    if (callback instanceof Promise) return this.launchTimerPromise(callback, arg);
    if (callback && {}.toString.call(callback) !== '[object Function]')
			throw new Error('The passed callback is not a function.');
		_callback.set(this, callback);
		_arg.set(this, arg);
    aborted.set(this, false);
    inProgress.set(this, true);
    startedAt.set(this, new Date());
    timeId.set(this, setTimeout(this.tick, this.timer, this));
  }

  tick(self) {
    if (self.timeId) clearTimeout(self.timeId);
    self.verifyTime();
		if (self.isAborted)  {
			const callback = _callback.get(self);
			const arg = _arg.get(self);
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
		if (this.inProgress) throw new Error('Timer already launched.');
		const self = this;
		if (!promise instanceof Promise) throw new Error('`First argument` must be a Promise or a Function.');
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


function getId(id = ''){
	validateId(id);
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
	if (typeof id !== 'string' && typeof id !== 'number') throw new Error('`_id` must be a String or a Number.');
	if (id === 0) throw new Error('`_id` must not be `null` or equal to `0`.');
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

// export default Timer;
module.exports = Timer;
