const tap = require('tap');
const { wait, waitFail, SECOND } = require('../wait');
const Timer = require('../../index');

tap.test('Promise tests', async t => {
	t.jobs = 5;
	t.test('Reject Promise due to timeout', async t => {
		timer = new Timer(10);
		const promise = wait(undefined, timer);
		return timer.launchTimer(promise)
			.then(_ => {
				t.fail('It Succeed...?!');
				t.end();
			})
			.catch(error => {
				t.equal(error, 'TimeOut');
				t.end();
			});
	});
	
	t.test('Reject Promise due to timeout with pass error log', async t => {
		timer = new Timer(10);
		const promise = wait(undefined, timer);
		const errorMsg = 'Time runned out.';
		return timer.launchTimer(promise, errorMsg)
			.then(_ => {
				t.fail('It Succeed...?!');
				t.end();
			})
			.catch(error => {
				t.equal(error, errorMsg);
				t.end();
			});
	});
	
	t.test('Resolve Promise', async t => {
		timer = new Timer(2 * SECOND);
		const promise = wait(undefined, timer);
		return timer.launchTimer(promise)
			.then(_ => t.pass('Good, it succeed.') && t.end())
			.catch(_ => t.fail('It failed...?!') && t.end());
	});
	
	t.test('Reject Promise due to promise failure', async t => {
		timer = new Timer(2 * SECOND);
		const promise = waitFail(undefined, timer);
		return timer.launchTimer(promise)
			.then(_ => t.fail('It Succeed...?!') && t.end())
			.catch(_ => t.pass('Good, it Failed.') && t.end());
	});
	
	t.test('Reject Promise due to promise failure with pass error log', async t => {
		timer = new Timer(2 * SECOND);
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

	t.end();
});