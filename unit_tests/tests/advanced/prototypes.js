const sleep = require('../../helpers/sleep');
const isProd = process.env.ISPROD === 'true';
const Timer = require(isProd ? '../../../time_class' : '../../../index');
const { SECOND, wait } = require('../../helpers/wait');

function tests(t) {
  t.jobs = 1;
  
  t.test('Calling _tick', async t => {
    const timer = new Timer(2 * SECOND, { id: 'tick' });
    const promise = timer.launchTimer(wait(undefined, timer));
    const timeout = timer._timeId;
    await sleep(5);
    timer._tick(timer);
    const timeout2 = timer._timeId;
    if (timeout._destroyed && timeout._idleStart !== timeout2._idleStart) t.pass('_tick worked.');
    else t.fail('_tick did not clearTimeout.');
    try {
      timer.abort();
      await promise;
    } catch (_) {}
    t.end()
  });
  
  t.test('Calling _tick without self', async t => {
    const timer = new Timer(2 * SECOND, { id: 'tick' });
    const promise = timer.launchTimer(wait(undefined, timer));
    try {
      timer._tick();
      t.fail('_tick did not trigger an error.');
    } catch (e) {
      const msg = e.message || e;
      t.equal(msg, 'Tick is being call without instance of Timer.');
    }
    try {
      timer.abort();
      await promise;
    } catch (_) {}
    t.end()
  });

  t.end();
}

module.exports = tests;