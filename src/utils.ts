import { GenericObject } from './interfaces/common.interface.js';
import * as Errors from './errors/index.js';

export function get<T>(
  object: GenericObject,
  path: string,
  defaultValue = undefined,
): T | undefined {
  if (object == null || path == null) {
    return defaultValue;
  }

  const keys = Array.isArray(path)
    ? path
    : path.replace(/\[(\d+)\]/g, '.$1').split('.');

  let result = object;

  for (const key of keys) {
    if (result == null) return defaultValue;
    result = result[key];
  }

  return (result === undefined ? defaultValue : result) as T | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isDNIPError(err: any, path?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof err === 'object' && path != null ? get<any>(err, path)?.dnip : err.dnip;
}

export function createError(err: unknown): Error {
  if (!(err instanceof Error)) {
    return new Errors.UnknownError('Unknown Error', { err });
  }

  if (err instanceof Errors.BaseError) {
    return err;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const Instance = Errors[err.name];

  if (Instance == null) {
    return new Errors.UnknownError(err.message, { err });
  }

  const error = err as Errors.BaseError;

  if (error.code != null && error.type != null && error.data != null) {
    return new Instance(error.message, error.code, error.type, error.data);
  }
  if (error.code != null && error.type != null) {
    return new Instance(error.message, error.code, error.type);
  }
  if (error.code != null) {
    return new Instance(error.message, error.code);
  }
  return new Instance(error.message);
}
