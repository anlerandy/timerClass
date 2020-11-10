const tap = require('tap');
const { wait, SECOND } = require('../helpers/wait');
const isProd = process.env.ISPROD === 'true';
const Timer = require(isProd ? '../../time_class' : '../../index');

tap.test('Update tests', async t => {
  t.jobs = 2;
  t.test('Sucessful updates (async)', async t => {
    timer = new Timer(SECOND);
    const promise = wait(undefined, timer);
    return timer.launchTimer(promise)
      .then(_ => {
        t.pass('Updates went well.');
        t.end();
      })
      .catch(error => {
        t.fail('It timed out?!');
        t.end();
      });
  });

  t.test('Sucessful updates (sync)', async t => {
    timer = new Timer(SECOND);
    const test = new Promise((resolve, _) => {
      const failed = () => {
        t.fail('It timed out?!');
        resolve();
        t.end();
      };
      const promise = wait(undefined, timer);
      timer.launchTimer(failed);
      const succeed = () => {
        try {
          timer.done()
        } catch (e) {
          t.fail('timer.done() is not working properly', e.message || e);
          t.end();
          return;
        }
        resolve();
        t.pass('Updates went well.');
        t.end();
      };
      return promise.then(succeed);
    });
    return await test;
  });

  t.end();
});
