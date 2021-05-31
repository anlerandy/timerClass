const tap = require('tap');
const { SECOND, wait } = require('../helpers/wait');
const isProd = process.env.ISPROD === 'true';
const Timer = require(isProd ? '../../time_class' : '../../index');

tap.test('Getters test', t => {
  t.jobs = 6;
  
  t.test('Get CreatedAt', t => {
    const timer = new Timer();
    const now = new Date();
    const createdAt = timer.getCreatedAt();
    const nowV = now.valueOf();
    const createV = createdAt.valueOf();
    if (nowV - 10 <= createV && createV <= nowV + 10) t.pass();
    else t.fail();
    t.end();
  });
  
  t.test('Get startedAt', t => {
    const timer = new Timer(SECOND);
    timer.launchTimer(() => {});
    const now = new Date();
    const startedAt = timer.getStartedAt();
    const nowV = now.valueOf();
    const startV = startedAt.valueOf();
    if (nowV - 10 <= startV && startV <= nowV + 10) t.pass();
    else t.fail();
    t.end();
  });
  
  t.test('Get startedAt Not started', t => {
    const timer = new Timer();
    const startedAt = timer.getStartedAt();
    if (!startedAt) t.pass();
    else t.fail();
    t.end();
  });
  
  t.test('Get isSelfAborted (true)', async t => {
    const timer = new Timer(SECOND / 2, { destroy: false });
    const promise = timer.launchTimer(wait(undefined, timer));
    try {
      await promise;
      t.fail('It succeed...?!');
    } catch (e) {
      const msg = e.message || e;
      if (timer.getIsSelfAborted()) t.equal(msg, 'TimeOut');
      else t.fail('isSelfAborted value should be `true`.');
    }
    t.end();
  });
  
  t.test('Get isSelfAborted (false) & isAborted', async t => {
    const timer = new Timer(SECOND, { destroy: false });
    const promise = timer.launchTimer(wait(undefined, timer));
    try {
      timer.abort();
      await promise;
      t.fail('It succeed...?!');
    } catch (e) {
      const msg = e.message || e;
      const isSelfAborted = timer.getIsSelfAborted();
      if (!isSelfAborted && timer.getIsAborted()) t.equal(msg, 'TimeOut');
      else {
        const field = isSelfAborted ? 'isSelfAborted' : 'isAborted';
        const value = isSelfAborted ? 'false' : 'true';
        t.fail(`${field} value should be \`${value}\`.`);
      }
    }
    t.end();
  });
  
  t.test('Get time', async t => {
    const timer = new Timer(SECOND);
    timer.setTime(2 * SECOND);
    timer.setTime('wuoifne');
    t.equal(timer.getTime(), 2 * SECOND);
    timer.setTime('23421wuoifne');
    t.equal(timer.getTime(), 2 * SECOND);
    timer.destroy();
    timer.setTime(SECOND);
    t.equal(timer.getTime(), undefined);
    t.end();
  });

  t.end();
});