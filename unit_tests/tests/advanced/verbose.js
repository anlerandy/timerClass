const isProd = process.env.ISPROD === 'true';
const Timer = require(isProd ? '../../../time_class' : '../../../index');
const { SECOND, wait } = require('../../helpers/wait');

function tests(t) {
  t.jobs = 4;

  t.test('Verbose level 10', async t => {
    const timer = new Timer(SECOND, { id: 'level13', verbose: 13 });
    try {
      const promise = timer.launchTimer(wait(undefined, timer, 'Launching timer'));
      timer.update('An update test');
      timer._log("Useful to identify the timer.");
      timer.abort();
      await promise;
      t.fail();
    } catch (e) {
      t.pass();
    }
    t.end()
  })

  t.test('Verbose level 20', async t => {
    const timer = new Timer(SECOND, { id: 'level23', verbose: 23 });
    try {
      const promise = timer.launchTimer(wait(undefined, timer, 'Launching timer'));
      timer.update('An update test');
      timer._log("Date the log.");
      timer._log();
      timer.abort();
      await promise;
      t.fail();
    } catch (e) {
      t.pass();
    }
    t.end()
  })

  t.test('Verbose level 30', async t => {
    const timer = new Timer(SECOND, { id: 'level33', verbose: 33 });
    try {
      const promise = timer.launchTimer(wait(undefined, timer, 'Launching timer'));
      timer.update('An update test');
      timer._log("Could provide the next timeOut schedule for tests.");
      timer.abort();
      await promise;
      t.fail();
    } catch (e) {
      t.pass();
    }
    t.end()
  })

  t.test('Destroyed Verbose', async t => {
    const timer = new Timer(SECOND, { id: 'level33', verbose: 33 });
    try {
      const promise = timer.launchTimer(wait(undefined, timer, 'Launching timer'));
      timer.update('An update test');
      timer.abort();
      await promise;
      t.fail();
    } catch (e) {
      try {
        timer._log("After a destroy log.");
        t.fail();
      } catch (e) {
        t.equal(e.message, 'Timer is being deleted.');
      }
    }
    t.end()
  })

  t.end();
}

module.exports = tests;