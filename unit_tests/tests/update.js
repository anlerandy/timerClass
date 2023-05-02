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

  t.test('Launch Or Update (Promise)', async (t) => {
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

  t.test('Launch Or Update (Callback)', async (t) => {
    const timer = new Timer(SECOND, { destroy: false });
    let i = 0;

    function _() {
      ++i;
    }

    timer.launchOrUpdate(_);

    await sleep(SECOND).then(() => {
      // Since we waited exactly 1 Second, no callback = i === 0;
      timer.launchOrUpdate(_);
      return sleep(2 * SECOND).then(async () => {
        // Since we waited 2 Seconds, callback = i === 1;
        timer.launchOrUpdate(_);
        return await sleep(2 * SECOND).then(async () => {
          // Since we waited 2 Seconds, callback = i === 2;
          timer.launchOrUpdate(_);
          return await sleep(SECOND);
        });
      });
    });
    // Since we waited exactly 1 Second, no callback = i === 2;

    timer.done();
    t.same(i, 2);
    t.end();
  });

  t.test('Launch Or Update (Interval)', async (t) => {
    const timer = new Timer(SECOND, { destroy: false });
    let i = 0;

    function _() {
      timer.launchOrUpdate(() => {
        ++i;
        _();
      });
    }

    _();
    await sleep(SECOND);
    _();
    // i === 0;
    await sleep(1.5 * SECOND);
    _();
    // i === 1;
    await sleep(SECOND);
    _();
    // i === 1;
    await sleep(2.5 * SECOND);
    _();
    // i === 3;
    await sleep(SECOND);
    _();
    // i === 3;

    timer.done();
    await sleep(1.3 * SECOND);
    // i === 3;
    t.same(i, 3);
    t.end();
  });

  t.end();
});
