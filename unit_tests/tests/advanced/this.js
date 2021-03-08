const sleep = require('../../helpers/sleep');
const isProd = process.env.ISPROD === 'true';
const Timer = require(isProd ? '../../../time_class' : '../../../index');
const { SECOND, MINUTE, wait } = require('../../helpers/wait');

const toThread = (fn, arg, time = SECOND / 2) =>
  new Promise((res, rej) => {
    setTimeout(async () => {
      try {
        await fn(arg);
        res(true);
      } catch {
        rej(false);
      }
    }, time);
  });

const toProtectedThread = async (fn, arg, time = SECOND / 2) => {
  try {
    await toThread(fn, arg, time);
    throw new Error('It succeed unexpectedly...');
  } catch {};
};

const waiters = new Array(MINUTE).fill(SECOND / 2);

function tests(t) {
  t.jobs = 1;

  t.test('Method in sub thread', async t => {
    const timer = new Timer(SECOND, { destroy: false });
    const promise = timer.launchTimer(wait(waiters, timer));
    try {
      await toThread(timer.update);
      timer.update();
      await toThread(timer.done);
      timer.update();
      await toThread(timer.abort);
      timer.update();
      await toThread(timer.destroy);
      timer.update();
      await toProtectedThread(timer.launchTimer, 'test');
      timer.update();
      await toProtectedThread(timer.launchTimerPromise);
      timer.done();
      await promise;
    } catch (e) {
      timer.done();
      t.fail(e.message || e);
    }
    timer.done();
    t.end();
  });

  t.end();
}

module.exports = tests;