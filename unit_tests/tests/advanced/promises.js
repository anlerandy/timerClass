const isProd = process.env.ISPROD === 'true';
const Timer = require(isProd ? '../../../time_class' : '../../../index');
const { SECOND, wait, waitFail } = require('../../helpers/wait');

function tests(t) {
  t.jobs = 1;

  t.test('Test of promises', async t => {
		const timer = new Timer();
		const clock = timer.launchTimer(timer.abort, 'Aborting Timer.');
		const promise = wait(undefined, timer);
		try {
			console.log(await promise);
			timer.done();
			console.log(await clock);
		} catch (e) {
			console.log({e});
		}
    t.end();
	});
  
  t.test('Test of promises correct finish', async t => {
		const timer = new Timer();
		timer.launchTimer(timer.abort, 'Aborting Timer.');
		wait(undefined, timer).then(_ => timer.done(_));
    t.end();
	});
  
  t.test('Test of promises uncorrect finish', async t => {
		const timer = new Timer(SECOND / 2);
		timer.launchTimer(undefined, 'Aborting Timer.');
		wait(undefined, timer).then(_ => timer.done(_));
    t.end();
	});

	t.end();
}

module.exports = tests;