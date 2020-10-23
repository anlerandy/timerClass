const tap = require('tap');
const { SECOND } = require('../helpers/wait');
const Timer = require('../../index');

tap.test('Save & Destroy tests', async t => {
	t.jobs = 6;

	t.test('Create timer without saving it', t => {
		new Timer(SECOND, { id: 'notSaved', save: false });
		const savedTimer = Timer.getById('notSaved', { createOne: false });
		if (savedTimer) t.fail('Should not exist...');
		else t.pass('Timer not found.');
		t.end();
	});
	
	t.test('Create & destroy', t => {
		const timer = new Timer(SECOND, { id: 'saved' });
		const saved = Timer.getById('saved', { createOne: false });
		if (!saved) t.fail('The timer was not saved?!');
		timer.destroy();
		if (timer._id) t.fail('Should not have its `_id`.');
		else {
			const saved = Timer.getById('saved', { createOne: false });
			if (saved) t.fail('We should not find it.');
			else t.pass('Not found after destroy.');
		}
		t.end();
	});
	
	t.test('Double destroy', t => {
		const timer = new Timer(SECOND, { save: false });
		timer.destroy();
		try {
			timer.destroy();
			t.pass('Second destroy did not go wrong.');
		} catch (e) {
			t.fail('Second destroy trigger an error.', e.message || e);
		}
		t.end();
	});
	
	t.test('Done & Abort after destroy', t => {
		const timer = new Timer(SECOND, { save: false });
		timer.destroy();
		let i = 0;
		try {
			timer.done();
			++i;
			timer.abort();
			t.pass('Done & Abort after destroy did not trigger errors.');
		} catch (e) {
			if (i === 1) t.fail('Abort triggered an error...', e.message || e);
			if (!i) t.fail('Done triggered an error...', e.message || e);
		}
		t.end();
	});
	
	t.test('Destroy timer through done', t => {
		const timer = new Timer(SECOND, { save: false });
		timer.done();
		if (timer._id) t.fail('Still has its `_id`.');
		else t.pass('Done correctly destroyed the timer.');
		t.end();
	});
	
	t.test('Done does not destroy', t => {
		const timer = new Timer(SECOND, { destroy: false });
		timer.done();
		if (!timer._id) t.fail('Timer has been destroyed');
		else t.pass('Done did not destroy the timer.');
		timer.destroy();
		t.end();
	});

	t.end();
});