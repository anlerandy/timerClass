const tap = require('tap');
const sleep = require('../helpers/sleep');
const { wait, waitFail, SECOND } = require('../helpers/wait');
const isProd = process.env.ISPROD === 'true';
const Timer = require(isProd ? '../../time_class' : '../../index');

tap.test('Promise tests', async t => {
  t.jobs = 6;
  t.test('Reject Promise due to timeout', async t => {
    const timer = new Timer(10);
    const promise = wait(undefined, timer);
    return timer.launchTimer(promise)
      .then(_ => {
        t.fail('It Succeed...?!');
        t.end();
      })
      .catch(error => {
        t.equal(error.message || error, 'TimeOut');
        t.end();
      });
  });
  
  t.test('Reject Promise due to timeout with pass error log', async t => {
    const timer = new Timer(10);
    const promise = wait(undefined, timer);
    const errorMsg = 'Time runned out.';
    return timer.launchTimer(promise, errorMsg)
      .then(_ => {
        t.fail('It Succeed...?!');
        t.end();
      })
      .catch((error) => {
        t.equal(error.message || error, errorMsg);
        t.end();
      });
  });
  
  t.test('Resolve Promise', async t => {
    const timer = new Timer(2 * SECOND);
    const promise = wait(undefined, timer);
    return timer.launchTimer(promise)
      .then(_ => t.pass('Good, it succeed.') && t.end())
      .catch(_ => t.fail('It failed...?!') && t.end());
  });
  
  t.test('Reject Promise due to promise failure', async t => {
    const timer = new Timer(2 * SECOND);
    const promise = waitFail(undefined, timer);
    return timer.launchTimer(promise)
      .then(_ => t.fail('It Succeed...?!') && t.end())
      .catch(_ => t.pass('Good, it Failed.') && t.end());
  });
  
  t.test('Reject Promise due to promise failure with pass error log', async t => {
    const timer = new Timer(2 * SECOND);
    const errorMsg = 'Promise Failed. We gave it an arg that should not be displayed.';
    const promise = waitFail(undefined, timer);
    return timer.launchTimer(promise, errorMsg)
      .then(_ => t.fail('It Succeed...?!') && t.end())
      .catch(error => {
        const msg = error?.message;
        if (!msg) t.fail('Why there is no error?');
        else t.notEqual(msg, errorMsg);
        t.end();
      });
  });
  
  t.test('Reject Promise due to timeout after setting time', async t => {
    const timer = new Timer(2 * SECOND);
    const errorMsg = 'Promise Failed. We gave it an arg that should not be displayed.';
    const promise = timer.launchTimer(wait(undefined, timer), errorMsg);
    await sleep(SECOND / 2);
    try {
      timer.time = SECOND / 4;
      await promise;
      t.fail('Should have timeout...');
    } catch (e) {
      t.equal(e.message || e, errorMsg);
    }
    t.end();
  });

  t.end();
});