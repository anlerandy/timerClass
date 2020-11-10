const tap = require('tap');
const { SECOND, wait } = require('../helpers/wait');
const isProd = process.env.ISPROD === 'true';
const Timer = require(isProd ? '../../time_class' : '../../index');

const logs = ['A String', { log:'An object' }, ['An Array']]; 

tap.test('Verbose tests', t => {

  t.jobs = 7;

  const testName0 = 'Launch with verbose (async)';
  t.test(testName0, async t => {
    const timer = new Timer(SECOND);
    await timer.launchTimer(wait(undefined, timer), null, testName0, ...logs);
    t.pass();
    t.end();
  });

  const testName1 = 'Launch with verbose (sync)';
  t.test(testName1, async t => {
    const timer = new Timer(SECOND);
    const promise = wait(undefined, timer);
    timer.launchTimer(() => {}, null, testName1, ...logs);
    await promise;
    t.pass();
    t.end();
  });

  const testName2 = 'Update with verbose';
  t.test(testName2, async t => {
    const timer = new Timer(SECOND);
    await timer.launchTimer(wait(undefined, timer, testName2, ...logs));
    t.pass();
    t.end();
  });

  const testName3 = 'Done with verbose';
  t.test(testName3, async t => {
    const timer = new Timer(SECOND);
    timer.launchTimer(wait(undefined, timer));
    timer.done(testName3, ...logs);
    t.pass();
    t.end();
  });

  const testName4 = 'Abort with verbose';
  t.test(testName4, async t => {
    try {
      const timer = new Timer(SECOND);
      const promise = timer.launchTimer(wait(undefined, timer));
      timer.abort(testName4, ...logs);
      await promise;
    } catch {
      t.pass();
    }
    t.end();
  });

  const testName5 = 'Wrong Logger';
  t.test(testName5, async t => {
    try {
      const wrongLogger = (...args) => {
        throw args;
      }
      const timer = new Timer(SECOND, { log: wrongLogger });
      const promise = timer.launchTimer(wait(undefined, timer));
      timer.abort(testName5, ...logs);
      await promise;
    } catch {
      t.pass();
    }
    t.end();
  });

  const testName6 = 'Custom Logger';
  t.test(testName6, async t => {
    try {
      const log = (...args) => {
        console.log(...args.map(arg => `${arg}`.toUpperCase() ));
      }
      const timer = new Timer(SECOND, { log });
      const promise = timer.launchTimer(wait(undefined, timer));
      timer.abort(testName6, ...logs);
      await promise;
    } catch {
      t.pass();
    }
    t.end();
  });

  t.end();
});