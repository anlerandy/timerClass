const tap = require('tap');
const { SECOND, wait } = require('../wait');
const Timer = require('../../index');

const KBYTES = 1024;
const MBYTES = KBYTES * KBYTES;
// The env should be launch with next var value (50Mo)
const MAX = 50 * MBYTES;

const getOccurrencesMax = () => {
	const timer = new Timer(SECOND);
	const {heapTotal, rss} = process.memoryUsage();
	const memoryMB = heapTotal / MBYTES;
	const rssMB = rss /MBYTES;
	console.log(rss, rssMB, heapTotal, memoryMB);
	// x = MAX;
	// 1 = SoT;
	// const occurences = MAX / sizeOfTimer;
	// console.log({occurences});
	// return occurences;	
};

tap.test('Stress test', t => {
	const max = 1000;
	for (let i = 0; i < max; ++i) {
		try {
			// console.log({i})
			// getOccurrencesMax();
			const timer = new Timer(SECOND / 2, {destroy: false});
			try {
				const promise = timer.launchTimer(wait(undefined, timer));
				timer.abort();
				timer.destroy();
				await promise;
			} catch (e) {}
			console.log({id: timer._id});
			getOccurrencesMax();
		} catch (e) {
			t.fail(e.message || e);
		}
	}
	t.end();
});