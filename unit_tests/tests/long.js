const Timer = require('../timer');
const tap = require('tap');
const { MINUTE } = require('../helpers/wait');

tap.test('Long test', async (t) => {
  const timer = new Timer(2 * MINUTE, { verbose: 34 });
  const promise = timer.launchTimer(new Promise(() => {}));
  await promise.then(() => t.fail("Didn't fail...")).catch(() => t.ok('Failed correctly.'));
  t.end();
});

// TODO: Compare finishing date from expected date on bigger time test
