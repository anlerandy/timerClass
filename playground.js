import Timer from './time.class';

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
  const timer = new Timer(10 * SECOND);
  const timer2 = new Timer(10 * SECOND);
  const msg = 'Failed to finish before time runs out...';
  const promises = array.reduce(async (acc, time) => {
    const previous = await acc;
    const waiter = await sleep(time);
    timer.update('try');
    return [...previous, waiter];
  }, []);
  timer2.launchTimer(console.log);
  try {
    console.log(timer.createdAt);
    console.log(2, timer.createdAt);
    const times = await timer.launchTimerPromise(promises, msg);
    timer.done();
    return times;
  } catch (_) {
    console.log(_.message);
    timer.launchTimer(console.log, promises);
    return await promises;
  }
};

const main = async () => {
  try {
    const times = await test();
    console.log({ times });
    process.exit();
  } catch (e) {
    console.log(e.message || e);
    process.exit();
  }
};

main();
