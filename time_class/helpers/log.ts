import Timer from '../';

const DefaultV = {
  UPDATE: 'Updated',
  DONE: 'Done',
  ABORT: 'Aborted',
  LAUNCH: 'Launched',
  TICK: 'Ticked'
};

function formatHour(date = new Date()): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const millis = date.getMilliseconds();
  return `${hours}:${minutes}:${seconds}:${millis}`;
}

function formatDate(date: Date): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const dateString = `${day}/${month}/${year}`;
  const hours = formatHour(date);
  return `${dateString} ${hours}`;
}

type LogFunction = (...args: Array<any>) => Promise<any> | any;
export type VerboseLevel =
  | 0
  | 1
  | 11
  | 12
  | 13
  | 14
  | 20
  | 21
  | 22
  | 23
  | 24
  | 30
  | 31
  | 32
  | 33
  | 34;

interface VerboseArguments {
  args: Array<any>;
  log?: 'UPDATE' | 'DONE' | 'ABORT' | 'LAUNCH' | 'TICK';
  level?: VerboseLevel;
  timer: Timer;
}

function getVerbose({
  args,
  log,
  level,
  timer: { _id, createdAt, _lastUpdate = createdAt.valueOf(), time }
}: VerboseArguments) {
  const msg = args.length ? args : [log && DefaultV[log]].filter(Boolean);
  const lastUpdate = new Date(_lastUpdate + time);
  const array = [...msg].filter(Boolean);
  const addLvl = level || 0 / 10;
  if (addLvl >= 1) array.push(`(_id: ${_id})`);
  if (addLvl >= 2) array.unshift(`${formatHour()}`);
  if (addLvl >= 3) array.push(`Timeout on ${formatDate(lastUpdate)}.`);
  return array;
}

export default function initLogger(logFn: LogFunction, level: VerboseLevel, timer: Timer) {
  return {
    update: updateLog(logFn, level, timer),
    done: doneLog(logFn, level, timer),
    abort: abortLog(logFn, level, timer),
    launch: launchLog(logFn, level, timer),
    tick: tickLog(logFn, level, timer),
    log: defaultLog(logFn, level, timer)
  };
}

function defaultLog(logFn: LogFunction, level?: VerboseLevel, timer?: Timer) {
  return function (...args: Array<any>) {
    try {
      if (timer) args = getVerbose({ args, level, timer });
      logFn(...args);
    } catch (e) {
      console.error('TIMER: Your logger is not working properly.', e);
    }
  };
}

function updateLog(logFn: LogFunction, level: VerboseLevel, timer: Timer) {
  return function (...args: Array<any>) {
    if (!args.length && level % 10 < 3) return;
    args = getVerbose({ args, log: 'UPDATE', level, timer });
    defaultLog(logFn)(...args);
  };
}

function tickLog(logFn: LogFunction, level: VerboseLevel, timer: Timer) {
  return function (...args: Array<any>) {
    if (level % 10 < 4) return;
    args = getVerbose({ args, log: 'TICK', level, timer });
    defaultLog(logFn)(...args);
  };
}

function doneLog(logFn: LogFunction, level: VerboseLevel, timer: Timer) {
  return function (...args: Array<any>) {
    if (!args.length && level % 10 < 2) return;
    args = getVerbose({ args, log: 'DONE', level, timer });
    defaultLog(logFn)(...args);
  };
}

function abortLog(logFn: LogFunction, level: VerboseLevel, timer: Timer) {
  return function (...args: Array<any>) {
    if (!args.length && level % 10 < 2) return;
    args = getVerbose({ args, log: 'ABORT', level, timer });
    defaultLog(logFn)(...args);
  };
}

function launchLog(logFn: LogFunction, level: VerboseLevel, timer: Timer) {
  return function (...args: Array<any>) {
    if (!args.length && level % 10 < 1) return;
    args = getVerbose({ args, log: 'LAUNCH', level, timer });
    defaultLog(logFn)(...args);
  };
}
