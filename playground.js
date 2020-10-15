// import Timer from './time.class';
const Timer = require('./time.class');

const sleep = (time) => new Promise((res) => setTimeout(res, time, time));

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HALF = MINUTE / 2;
const TWO = 2 * MINUTE;
const ONEMHALF = MINUTE + HALF;
const TWOMHALF = ONEMHALF + MINUTE;

const test = async () => {
  const array = [
    SECOND,
    SECOND,
    SECOND,
    SECOND,
    SECOND,
    SECOND,
    SECOND,
    SECOND,
    SECOND,
    SECOND,
    SECOND,
    SECOND,
    SECOND,
    SECOND,
    MINUTE,
    HALF,
    ONEMHALF,
    TWO,
    TWOMHALF
  ];
	const timer = Timer.getById('testTimer')
  const timer2 = Timer.getById('testTimer')
	console.log(timer._id, timer2._id);
  const msg = 'Failed to finish before time runs out...';
  const promises = array.reduce(async (acc, time) => {
		const previous = await acc;
    const waiter = await sleep(time);
    timer.update('try');
    return [...previous, waiter];
  }, []);
  // timer2.launchTimer(console.log);
  try {
    const times = timer.launchTimer(promises, msg);
		// timer2.launchTimer(promises, msg);
		await timer;
		await timer2;
    timer.done();
    return times;
  } catch (_) {
    console.log(_.message);
    // timer.launchTimer(console.log, promises);
    return await promises;
  }
};

const main = async () => {
  try {
		const times = await test();
		console.log({ times });
		console.log(Timer.timer);
    process.exit();
  } catch (e) {
    console.log(e.message || e);
    process.exit();
  }
};

main();
