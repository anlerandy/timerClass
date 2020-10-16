const validateId = require('./validator/id');

const TIMERS = new WeakMap();

function getTimerById(Timer) {
	return function (id, options = {}) {
		const { createOne = true, time } = options;
		validateId(id);
		const timers = TIMERS.get(Timer) || {};
		const timer = timers[id];
		if (!timer && createOne) return new Timer(time, { ...options, id });
		return timer;
	}
}

function getTimers(Timer) {
	return function () {
		const timers = TIMERS.get(Timer) || {};
		return timers;
	}
}

function saveTimer(Timer) {
	return function (timer) {
		const timers = TIMERS.get(Timer) || {};
		TIMERS.set(Timer, { ...timers, [timer._id]: timer });
	}
}

function getId(Timer){
	return function (id = '') {
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
}

function getStore(Timer) {
	const setter = saveTimer(Timer);
	const getter = getTimerById(Timer);
	const fullGetter = getTimers(Timer);
	const idStore = getId(Timer);
	const store = { saveTimer: setter, getTimer: getter, getAllTimers: fullGetter, getId: idStore };
	return store;
}

module.exports = getStore;