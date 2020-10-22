const tap = require('tap');
const { SECOND } = require('../helpers/wait');
const Timer = require('../../index');

tap.test('Errors feedBack tests', t => {

	t.jobs = 6;

	t.test('Callback is nor a Function nor a Promise', t => {
		const timer = new Timer(SECOND);
		try {
			timer.launchTimer({});
			t.fail('Should not work...');
		} catch (e) {
			const msg = e.message || e;
			t.equal(msg, 'The passed callback is not a function.');
		}
		t.end();
	});

	t.test('Passed argument is not a Promise', async t => {
		const timer = new Timer(SECOND);
		try {
			await timer.launchTimerPromise({});
			t.fail('Should not work...');
		} catch (e) {
			const msg = e.message || e;
			t.equal(msg, '`First argument` must be a Promise.');
		}
		t.end();
	});

	t.test('Already Launch', t => {
		const timer = new Timer(SECOND);
		timer.launchTimer();
		try {
			timer.launchTimer();
			t.fail('Should not work!');
		} catch (e) {
			const msg = e.message || e;
			t.equal(msg, 'Timer already launched.');
		}
		t.end();
	});

	t.test('Destroy running timer', t => {
		const timer = new Timer(SECOND);
		timer.launchTimer();
		try {
			timer.destroy();
			t.fail('Should not work!');
		} catch (e) {
			const msg = e.message || e;
			t.equal(msg, 'Please abort() or done() the Timer before destroying it.');
		}
		t.end();
	});

	t.test('Launching destroyed timer', t => {
		const timer = new Timer(SECOND);
		try {
			timer.destroy();
			try {
				timer.launchTimer();
				t.fail('Should not work!');
			} catch (e) {
				const msg = e.message || e;
				t.equal(msg, 'Timer is being deleted.');
			}
		} catch (e) {
			t.fail('destroy() failed. Might not working properly.');	
		}
		t.end();
	});

	t.test('Create a new timer with existing ID (unforced)', async t => {
		try {
			new Timer(SECOND, { id: 1 });
			t.fail('Nothing went wrong...?');
		} catch (e) {
			const msg = e.message || e;
			t.equal(msg, 'Timer already exist. To retrieve the existing one, please use `getById` Method.');
		}
		t.end();
	});

	t.end();
});