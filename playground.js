const Timer = require('./index');

const sleep = (time) => new Promise((res) => setTimeout(res, time, time));

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HALF = MINUTE / 2;
const TWO = 2 * MINUTE;
const ONEMHALF = MINUTE + HALF;
const TWOMHALF = ONEMHALF + MINUTE;

const array = [
  SECOND,
  SECOND,
  SECOND,
  // SECOND,
  // SECOND,
  // SECOND,
  // SECOND,
  // SECOND,
  // SECOND,
  // SECOND,
  // SECOND,
  // SECOND,
  // SECOND,
  // SECOND,
  // MINUTE,
  // HALF,
  // ONEMHALF,
  // TWO,
  // TWOMHALF
];

const fn = (timer, array) => array.reduce(async (acc, time) => {
	const previous = await acc;
  const waiter = await sleep(time);
  timer.update('try');
  return [...previous, waiter];
}, []);

const msg = 'Failed to finish before time runs out...';

const test = async () => {
	const timer = Timer.getById('testTimer', { destroy: true, time: 10 * SECOND })
  const promises = fn(timer, array);
  try {
    const times = timer.launchTimer(promises, msg);
    return times;
  } catch (_) {
    console.log('here:', _.message);
    return await promises;
  }
};

const test2 = async () => {
	const timer = Timer.getById('testTimer', { destroy: true, time: 10 * SECOND })
  try {
		const promise = await new Promise(async (resolve, reject) => {
			timer.launchTimer(reject, msg);
			const result = await fn(timer, [...array, MINUTE]);
			resolve(result);
		})
		return promise
  } catch (_) {
    console.log('here:', _.message);
    return _;
  }
};

const main = async () => {
  try {
		const times = await test2();
		console.log({ times });
		console.log(Timer.timer);
    process.exit();
  } catch (e) {
		console.log({e});
    process.exit();
  }
};

main();
