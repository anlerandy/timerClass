const tap = require('tap');
const { SECOND } = require('../helpers/wait');
const Timer = require('../../index');

tap.test('Getters test', t => {
	t.jobs = 3;
	
	t.test('Get CreatedAt', t => {
		const timer = new Timer();
		const now = new Date();
		const createdAt = timer.createdAt;
		if (now.valueOf() === createdAt.valueOf()) t.pass();
		else t.fail();
		t.end();
	});
	
	t.test('Get startedAt', t => {
		const timer = new Timer(SECOND);
		timer.launchTimer();
		const now = new Date();
		const startedAt = timer.startedAt;
		if (now.valueOf() === startedAt.valueOf()) t.pass();
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

	t.end();
});