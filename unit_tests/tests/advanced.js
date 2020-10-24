const tap = require('tap');
const { SECOND, wait } = require('../helpers/wait');
const sleep = require('../helpers/sleep');
const Timer = require('../../index');

tap.jobs = 1;

tap.test('Advanced tests', t => {
	t.jobs = 1;
	
	t.test('Get All Timers', t => {
		const timers = Timer.getAll();
		if (timers?.length) t.pass('We got an array of timers!');
		else t.fail('No timers found...');
		t.end()
	});
	
	t.test('Destroy All Timers (unforced)', t => {
		const a = Timer.getAll();
		Timer.destroyAll();
		const b = Timer.getAll();
		if (a.length > b.length) t.pass('Not running timers have been destroyed.');
		else t.fail('Still have same numbers of timers...');
		t.end()
	});
	
	t.test('Destroy All Timers (forced)', t => {
		const a = Timer.getAll();
		if (!a.length) t.fail('We have no timers in storage.');
		else {
			Timer.destroyAll(true);
			const b = Timer.getAll();
			if (!b.length) t.pass('All timers have been destroyed.');
			else if (b.length < a.length) t.fail('Only some timers have been destroyed...');
			else t.fail('No timers timers have been destroyed...');
		}
		t.end()
	});
	
	t.test('Empty Timer storage', t => {
		const timers = Timer.getAll();
		if (timers && !timers.length) t.pass('We have no timers in storage.');
		else t.fail(timers ? 'We have timers in sotre now...?!' : 'We should return an Array.');
		t.end()
	});
	
	t.test('Destroy when empty storage', t => {
		const timers = Timer.getAll();
		if (timers?.length) t.fail('We have timers in storage.');
		else {
			const timer = new Timer(0, { save: false, destroy: false });
			try {
				timer.destroy();
				t.pass('Destroy did not trigger any errors.');
			} catch (e) {
				const msg = e.message || e;
				t.fail('Destroy triggered an error.', msg);
			}
		}
		t.end()
	});

	t.end();
});

tap.test('"Prototype" tests', t => {
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
});