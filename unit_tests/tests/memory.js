const tap = require('tap');
const { SECOND, wait } = require('../helpers/wait');
const Timer = require('../../index');

const KBYTES = 1024;
const MBYTES = KBYTES * KBYTES;

const getOccurrencesMax = () => {
	const { heapTotal, rss, external, heapUsed } = process.memoryUsage();
	const memoryMB = parseInt(heapTotal / MBYTES);
	const rssMB = parseInt(rss / MBYTES);
	const extMB = parseInt(external / MBYTES);
	const usedMB = parseInt(heapUsed / MBYTES);
	return `${rssMB} | ${memoryMB} | ${extMB} | ${usedMB}`;
};

async function test({ i, t }) {
	try {
		const timer = new Timer(SECOND / 100, { destroy: false });
		try {
			const promise = timer.launchTimer(wait(undefined, timer));
			await promise;
			timer.done();
		} catch (_) { }
		// Comment following line to try a SEGF();
		timer.destroy();
	} catch (e) {
		console.log('Something is wrong, please abort.', e.message || e);
	}
}

tap.test('Stress test', async t => {
	const max = 300;
	console.log('');
	for (let i = 0; i < max; ++i) {
		console.log('\033[1A\033[KPromise', `${i + 1}/${max} -`, getOccurrencesMax());
		await test({ i, t });
	}
	console.log(
		'\033[1A\033[K\033[1A\033[KTimers:',
		Timer.getAll(),
		getOccurrencesMax(),
		'\n\n'
	);
	t.pass('Stress went well!');
	t.end();
});