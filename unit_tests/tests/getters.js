const tap = require('tap');
const { SECOND, wait } = require('../helpers/wait');
const isProd = process.env.ISPROD === 'true';
const Timer = require(isProd ? '../../time_class' : '../../index');

tap.test('Getters test', t => {
	t.jobs = 5;
	
	t.test('Get CreatedAt', t => {
		const timer = new Timer();
		const now = new Date();
		const createdAt = timer.createdAt;
		const nowV = now.valueOf();
		const createV = createdAt.valueOf();
		if (nowV - 10 <= createV && createV <= nowV + 10) t.pass();
		else t.fail();
		t.end();
	});
	
	t.test('Get startedAt', t => {
		const timer = new Timer(SECOND);
		timer.launchTimer(() => {});
		const now = new Date();
		const startedAt = timer.startedAt;
		const nowV = now.valueOf();
		const startV = startedAt.valueOf();
		if (nowV - 10 <= startV && startV <= nowV + 10) t.pass();
		else t.fail();
		t.end();
	});
	
	t.test('Get startedAt Not started', t => {
		const timer = new Timer();
		const startedAt = timer.startedAt;
		if (!startedAt) t.pass();
		else t.fail();
		t.end();
	});
	
	t.test('Get hasTimeout (true)', async t => {
		const timer = new Timer(SECOND / 2, { destroy: false });
		const promise = timer.launchTimer(wait(undefined, timer));
		try {
			await promise;
			t.fail('It succeed...?!');
		} catch (e) {
			const msg = e.message || e;
			if (timer.hasTimeout) t.equal(msg, 'TimeOut');
			else t.fail('hasTimeout value should be `true`.');
		}
		t.end();
	});
	
	t.test('Get hasTimeout (false) & isAborted', async t => {
		const timer = new Timer(SECOND, { destroy: false });
		const promise = timer.launchTimer(wait(undefined, timer));
		try {
			timer.abort();
			await promise;
			t.fail('It succeed...?!');
		} catch (e) {
			const msg = e.message || e;
			if (!timer.hasTimeout && timer.isAborted) t.equal(msg, 'TimeOut');
			else {
				const field = timer.hasTimeout ? 'hasTimeout' : 'isAborted';
				const value = timer.hasTimeout ? 'false' : 'true';
				t.fail(`${field} value should be \`${value}\`.`);
			}
		}
		t.end();
	});

	t.end();
});