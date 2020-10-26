const UPDATE = 'Updated';
const DONE = 'Done';
const ABORT = 'Aborted';
const LAUNCH = 'Launched';
const DefaultV = { UPDATE, DONE, ABORT, LAUNCH };

function formatHour(date = new Date()) {
		const hours = date.getHours();
		const minutes = date.getMinutes();
		const seconds = date.getSeconds();
		const millis = date.getMilliseconds();
		return `${hours}:${minutes}:${seconds}:${millis}`;
}

function formatDate(date = new Date(), hour = true) {
	const day = date.getDate();
	const month = date.getMonth() + 1;
	const year = date.getFullYear();
	const dateString = `${day}/${month}/${year}`;
	if (hour) {
		const hours = formatHour(date);
		return `${dateString} ${hours}`;
	}
	return dateString;
}

function getVerbose({args = [], log, level = 0, timer: { _id, lastUpdate }}) {
	const msg = args?.length ? args : [DefaultV[log]];
	const array = [...msg];
	const addLvl = parseInt(level / 10);
	if (addLvl >= 1) array.push(`(_id: ${_id})` );
	if (addLvl >= 2) array.unshift(`${formatHour()}`);
	if (addLvl === 3) {
		const ms = lastUpdate.getMilliseconds();
		lastUpdate.setMilliseconds(ms + timer.timer);
		array.push(`Timeout on ${formatDate(lastUpdate)}.`)
	}
	return array;
}

function initLogger(log, level, timer) {
		return {
			update: updateLog(log, level, timer),
			done: doneLog(log, level, timer),
			abort: abortLog(log, level, timer),
			launch: launchLog(log, level, timer),
			log: defaultLog(log)
		}; 
}

function defaultLog(log) {
	return function (...args) {
		try {
			log(...args);
		} catch (e) {
			console.error('TIMER: Your logger is not working properly.', e);
		}
	}
}

function updateLog(log, level, timer) {
	return function (...args) {
		if (!args.length && (level % 10) < 3) return;
		args = getVerbose({ args, log: 'UPDATE', level, timer });
		defaultLog(log)(...args);
	}
}

function doneLog(log, level, timer) {
	return function (...args) {
		if (!args.length && (level % 10) < 2) return;
		args = getVerbose({ args, log: 'DONE', level, timer });
		defaultLog(log)(...args);
	}
}

function abortLog(log, level, timer) {
	return function (...args) {
		if (!args.length && (level % 10) < 2) return;
		args = getVerbose({ args, log: 'ABORT', level, timer });
		defaultLog(log)(...args);
	}
}

function launchLog(log, level, timer) {
	return function (...args) {
		if (!args.length && (level % 10) < 1) return;
		args = getVerbose({ args, log: 'LAUNCH', level, timer });
		defaultLog(log)(...args);
	}
}



module.exports = initLogger;