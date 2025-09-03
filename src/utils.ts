import * as Errors from './errors/index.js';

export function createError(err: unknown): Error {
  if (!(err instanceof Error)) {
    return new Errors.UnknownError('Unknown Error', { err });
  }

  if (
    err instanceof Errors.BaseError
    || (err as Errors.BaseError).dnip
  ) {
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
