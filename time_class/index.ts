import { initLogger, validateId, isFunction, VerboseLevel, raiseError } from './helpers';

interface Options {
  id: string | number;
  forceCreate?: boolean;
  save?: boolean;
  destroy?: boolean;
  verbose?: VerboseLevel;
  log?: (...args: any) => void | Promise<void>;
}

interface GetterOptions extends Omit<Options, 'id'> {
  time?: number;
  createOne?: boolean;
}

type Timers = Record<string | number, typeof Timer>;

const ALREADYRUN = 'Timer already launched.';
const THREADSCOPE = 'Unexpected launch of timer.';
const BEINGDELETE = 'Timer is being deleted.';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const MARGIN = 100;

const _ALL = new Array(14).fill(undefined).map((_) => new WeakMap());
const [
  createdAt,
  startedAt,
  aborted,
  outed,
  lastUpdate,
  _lastUpdate,
  inProgress,
  _destroy,
  _timeId,
  _id,
  _callback,
  _arg,
  _log,
  _timestamp
] = _ALL;

const TIMERS = new WeakMap();

export default class Timer {
  constructor(time?: number, options?: Options) {
    const {
      forceCreate,
      save = true,
      destroy = true,
      verbose = 0,
      log = console.log
    } = options || {};
    let { id } = options || {};
    if (!isFunction(log)) throw new TypeError('The passed log is not a function.');

    try {
      id = getId(id);
      if (!id) {
        raiseError(
          'Timer already exist. To retrieve the existing one, please use `getById` Method.'
        );
      }
    } catch (e) {
      if (!forceCreate) {
        throw e;
      }
      id = getId();
    }

    _id.set(this, id);
    if (save) {
      TIMERS.set(Timer, { ...TIMERS.get(Timer), [this._id]: this });
    }

    createdAt.set(this, new Date());
    aborted.set(this, false);
    outed.set(this, false);
    inProgress.set(this, false);
    _destroy.set(this, destroy);
    _log.set(this, initLogger(log, verbose, this));
    this.time = time || 2 * MINUTE;
  }

  set time(timestamp: number | string) {
    if (!this._id) return;
    const converted = parseInt(`${timestamp}`);
    if (`${converted}` !== `${timestamp}`) return;
    _timestamp.set(this, converted + MARGIN);
    this._tick();
  }

  get time(): number {
    if (!this._id) return 0;
    return _timestamp.get(this) - MARGIN;
  }

  private get _time(): number {
    return _timestamp.get(this);
  }

  get _id(): number | string {
    return _id.get(this);
  }

  get createdAt(): Date {
    return createdAt.get(this);
  }

  get startedAt(): Date {
    return startedAt.get(this);
  }

  get lastUpdate(): Date {
    return lastUpdate.get(this);
  }

  get _lastUpdate(): number {
    return _lastUpdate.get(this);
  }

  get inProgress(): boolean {
    return inProgress.get(this);
  }

  private get _timeId(): NodeJS.Timeout | undefined {
    return _timeId.get(this);
  }

  get isAborted(): boolean {
    return aborted.get(this);
  }

  get isSelfAborted(): boolean {
    return outed.get(this);
  }

  _log(...args: any) {
    if (!this._id) raiseError(BEINGDELETE);
    _log.get(this).log(...args);
  }

  private _tick() {
    clearTimeout(this._timeId);
    this._verifyTime(this);

    if (this.inProgress) {
      _log.get(this).tick();
      _timeId.set(this, this._set());
    }
  }

  private _set() {
    const last = this._lastUpdate;
    const now = new Date().valueOf();
    const nextTick = last - now + this._time;

    const _nextTick = nextTick > 60 * MINUTE ? 60 * MINUTE : nextTick;

    return setTimeout(this._tick.bind(this), _nextTick);
  }

  done(...log: Array<any>) {
    if (!(this || {}).inProgress) return;
    inProgress.set(this, false);
    clearTimeout(this._timeId);
    if (!this.isAborted) _log.get(this).done(...log);
    if (_destroy.get(this)) this.destroy();
  }

  abort(...log: any) {
    if (!(this || {}).inProgress) return;
    aborted.set(this, true);
    const callback = _callback.get(this);
    const arg = _arg.get(this);
    _log.get(this).abort(...log);
    callback(arg);
    this.done();
  }

  destroy() {
    if (!(this || {})._id) return;
    if (this.inProgress && !this.isAborted)
      raiseError('Please abort() or done() the Timer before destroying it.');
    const { [this._id]: timer, ...others } = TIMERS.get(Timer) as Timers;
    TIMERS.set(Timer, others);
    _ALL.map((el) => el.delete(this));
  }

  update(...log: Array<any>) {
    if (!(this || {}).inProgress) return;
    const date = new Date();
    lastUpdate.set(this, date);
    // setTimeout is apparently changing Date value, it is needed to have directly the BigInt:
    _lastUpdate.set(this, date.valueOf());
    _log.get(this).update(...log);
  }

  static getById(id: string | number, options: GetterOptions): Timer | undefined {
    return getTimerById(id, options);
  }

  static getAll(): Array<Timer> {
    return Object.values(TIMERS.get(Timer));
  }

  static destroyAll(force?: boolean) {
    destroyAll(force);
  }

  async launchTimerPromise<T extends any>(
    promise: Promise<T>,
    arg: any,
    ...log: Array<any>
  ): Promise<T> {
    if (!this) raiseError(THREADSCOPE);
    if (this.inProgress) raiseError(ALREADYRUN);
    if (!(promise instanceof Promise)) throw new TypeError('`First argument` must be a Promise.');
    const self = this;
    const timerPromise = new Promise((_, reject) => self.launchTimer(reject, arg, ...log));
    try {
      const result = await Promise.race([promise, timerPromise]);
      this.done();
      return result as T;
    } catch (e) {
      this.abort();
      throw e;
    }
  }

  private _verifyTime(timer: Timer) {
    if (timer.isAborted || !timer.inProgress) return;
    const now = new Date().valueOf();
    const limit = timer._lastUpdate + timer._time;
    if (now >= limit) {
      outed.set(timer, true);
      timer.abort();
    }
  }

  launchTimer<T extends any>(callback: Promise<T>, arg?: any, ...log: Array<any>): Promise<T>;
  launchTimer<T extends any>(
    callback: (...args: any[]) => T | Promise<T>,
    arg?: any,
    ...log: Array<any>
  ): undefined;
  launchTimer<T extends any>(
    callback: Promise<T> | ((...args: any[]) => T | Promise<T>),
    arg: any = 'TimeOut',
    ...log: Array<any>
  ) {
    if (!this) raiseError(THREADSCOPE);
    if (this.inProgress) raiseError(ALREADYRUN);
    if (!this._id) raiseError(BEINGDELETE);
    if (callback instanceof Promise<T>) return this.launchTimerPromise(callback, arg, ...log);
    if (!callback || !isFunction(callback))
      throw new TypeError(
        callback ? 'The passed callback is not a function.' : 'Callback is required.'
      );
    _callback.set(this, callback);
    _arg.set(this, arg);
    aborted.set(this, false);
    outed.set(this, false);
    inProgress.set(this, true);

    const date = new Date();
    startedAt.set(this, date);
    lastUpdate.set(this, date);
    _lastUpdate.set(this, date.valueOf());
    _timeId.set(this, this._set());

    _log.get(this).launch(...log);
    return undefined;
  }

  launchOrUpdate<T extends any>(
    callback: Promise<T>,
    arg?: any,
    ...log: Array<any>
  ): Promise<T> | undefined;
  launchOrUpdate<T extends any>(
    callback: (...args: any[]) => T | Promise<T>,
    arg?: any,
    ...log: Array<any>
  ): undefined;
  launchOrUpdate<T extends any>(
    callback: Promise<T> | ((...args: any[]) => T | Promise<T>),
    arg: any = 'TimeOut',
    ...log: Array<any>
  ) {
    if (!this) raiseError(THREADSCOPE);
    if (!this._id) raiseError(BEINGDELETE);
    if (this.inProgress) this.update();
    else if (callback instanceof Promise) return this.launchTimerPromise(callback, arg, ...log);
    else return this.launchTimer(callback, arg, ...log);
  }
}

function getId(id?: number | string) {
  const timers = TIMERS.get(Timer) as Timers;
  if (id) {
    validateId(id);
    if (!timers?.[id]) return id;
    else return;
  }
  id = 1;
  while (timers?.[id]) ++id;
  return id;
}

function getTimerById(id: string | number, options?: GetterOptions) {
  const { createOne = true, time } = options || {};
  validateId(id);
  const timers = TIMERS.get(Timer);
  const timer = timers[id];
  if (!timer && createOne) return new Timer(time, { ...options, id });
  return timer;
}

function destroyAll(force?: boolean) {
  Timer.getAll().map((timer) => {
    if (force) timer.abort();
    try {
      timer.destroy();
    } catch (_) {}
  });
}

TIMERS.set(Timer, {});
