const sleep = require('./sleep');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HALF = MINUTE / 2;
const TWO = 2 * MINUTE;
const ONEMHALF = MINUTE + HALF;
const TWOMHALF = ONEMHALF + MINUTE;

const _array = [
	SECOND,
	SECOND
];

const _wrongArray = [ ..._array ];
_wrongArray[0] = null;

const wait = (array = _array, timer, ...logs) => array.reduce(async (acc, timestamp) => {
	const res = await acc;
	await sleep(timestamp);
	if (timer) timer.update(...logs);
	return [ ...res, timestamp ];
}, []);

const waitFail = () => wait(_wrongArray);

const expected = _array;

module.exports = { wait, waitFail, expected, SECOND, MINUTE };
