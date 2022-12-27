import logInitier, { VerboseLevel as VerboseLevelImport } from './log';

export const initLogger = logInitier;
export type VerboseLevel = VerboseLevelImport;

export function validateId(id?: string | number) {
  if (typeof id !== 'string' && typeof id !== 'number')
    throw new TypeError('`_id` must be a String or a Number.');
  if (!id || (typeof id === 'number' && id < 1))
    throw new TypeError('`_id` must not be an empty String or equal to 0.');
}

export function isFunction(fn: any): fn is (...args: Array<any>) => Promise<any> | any {
  return (
    {}.toString.call(fn) === '[object Function]' ||
    {}.toString.call(fn) === '[object AsyncFunction]'
  );
}

export function raiseError(message: string) {
  throw new Error(message);
}
