const tap = require('tap');
const { SECOND } = require('../helpers/wait');
const isProd = process.env.ISPROD === 'true';
const Timer = require(isProd ? '../../time_class' : '../../index');

tap.test('getId tests', async t => {
  t.jobs = 8;

  t.test('Create two distinct timer', async t => {
    const timer = new Timer(2 * SECOND);
    const timer2 = new Timer(2 * SECOND);
    const id1 = timer._id;
    const id2 = timer2._id;
    t.match([id1, id2], [1, 2]);
    t.end();
  });

  t.test('Create two distinct timer with passed id', async t => {
    const timer = new Timer(2 * SECOND, { id: 'timer1'});
    const timer2 = new Timer(2 * SECOND, { id: 'timer2'});
    const id1 = timer._id;
    const id2 = timer2._id;
    t.match([id1, id2], ['timer1', 'timer2']);
    t.end();
  });

  t.test('Get stocked Timer', async t => {
    const timer = Timer.getById('timer1', { createOne: false });
    const id = timer?._id;
    if (!timer || !id) t.fail('No timer found?!');
    else t.equal(id, 'timer1');
    t.end();
  });

  t.test('Create a new timer with getById', async t => {
    let timer = Timer.getById('timer3', { createOne: false });
    if (timer) t.fail('Before trying to create Timer with getById, timer seems to exist of getById {createOne false} is not working properly.');
    timer = Timer.getById('timer3');
    const id = timer?._id;
    if (timer && id) t.pass('Sucessfully create a new Timer with getById');
    else t.fail('No Timer create by getById...');
    t.end();
  });

  t.test('Create a new timer with existing ID (forced)', async t => {
    const timer = new Timer(SECOND, { id: 'timer1', forceCreate: true });
    const id = timer?._id;
    if (!id) t.fail('It was not created?!');
    else t.notEqual(id, 'timer1');
    t.end();
  });

  t.test('Create a new timer with invalid ID (forced)', async t => {
    const timer = new Timer(SECOND, { id: true, forceCreate: true });
    const id = timer?._id;
    if (!id) t.fail('It was not created?!');
    else t.notEqual(id, true);
    t.end();
  });

  t.test('Use getById without passing id', async t => {
    try {
      Timer.getById();
      t.fail('Nothing went wrong...?');
    } catch (e) {
      const msg = e.message || e;
      t.equal(msg, '`_id` must be a String or a Number.');
    }
    t.end();
  });

  t.test('Use getById passing invalid id', async t => {
    try {
      const timer = Timer.getById(0);
      t.fail('Nothing went wrong...?');
    } catch (e) {
      const msg = e.message || e;
      t.equal(msg, '`_id` must not be an empty String or equal to 0.');
    }
    t.end();
  });

  t.end();
});