import Timer from '../../';
import tap from 'tap';

// This is only for checking import from TS project and IDE behaviours.
tap.test('Checking typescript compatibility', (t) => {
  t.test('Documentation', (t) => {
    const timer = new Timer(250);
    const shouldBeUndefined = timer.launchTimer(() => {
      t.pass();
      t.end();
    });

    const timer2 = new Timer(250);
    const asyncFn = (): Promise<undefined> => {
      return new Promise((res, rej) => res(undefined));
    };
    const shouldBeAPromise = timer2.launchTimer(asyncFn());
  });

  t.end();
});
