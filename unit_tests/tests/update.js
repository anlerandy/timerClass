const tap = require('tap');
const sleep = require('../helpers/sleep');
const { wait, SECOND } = require('../helpers/wait');

const Timer = require('../timer');

tap.test('Update tests', async (t) => {
  t.jobs = 2;
  t.test('Sucessful updates (async)', async (t) => {
    const timer = new Timer(SECOND);
    const promise = wait(undefined, timer);
    return timer
      .launchTimer(promise)
      .then((_) => {
        t.pass('Updates went well.');
        t.end();
      })
      .catch((_) => {
        t.fail('It timed out?!');
        t.end();
      });
  });

  t.test('Sucessful updates (sync)', async (t) => {
    const timer = new Timer(SECOND);
    const test = new Promise((resolve, _) => {
      const failed = () => {
        t.fail('It timed out?!');
        resolve();
      };
      const promise = wait(undefined, timer);
      timer.launchTimer(failed);
      const succeed = () => {
        try {
          timer.done();
        } catch (e) {
          t.fail('timer.done() is not working properly', e.message || e);
          return;
        }
        resolve();
        t.pass('Updates went well.');
      };
      return promise.then(succeed);
    });
    const result = await test;
    t.end();
    return result;
  });

  t.test('Launch Or Update (Fail)', async (t) => {
    const timer = new Timer(SECOND);
    const promise = timer.launchOrUpdate(sleep(3 * SECOND));
    sleep(SECOND).then(() => {
      timer.launchOrUpdate(promise);
    });
    try {
      await promise;
      t.fail('Still manage to succeed...? Next test will be invalid.');
    } catch {
      t.pass('Failed accordingly.');
    }
    t.end();
  });

  t.test('Launch Or Update', async (t) => {
    const timer = new Timer(SECOND);
    const promise = timer.launchOrUpdate(sleep(3 * SECOND));
    sleep(SECOND).then(() => {
      timer.launchOrUpdate(promise);
      sleep(SECOND).then(() => {
        timer.launchOrUpdate(promise);
      });
    });
    await promise;
    t.pass('Succeed to launch and update with same function.');
    t.end();
  });

  t.end();
});
