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

export function createError(error: unknown): Errors.BaseError {
  if (typeof error !== 'object') {
    return new Errors.UnknownError('Unknown Error', { error });
  }

  if (error instanceof Errors.BaseError) {
    return error;
  }

  const err = error as Errors.BaseError;

  switch (err.name) {
    case 'BadConfigError': {
      return new Errors.BadConfigError(err.message, err.data);
    }
    case 'BadRequestError': {
      return new Errors.BadRequestError(err.message, err.data);
    }
    case 'BadResponseError': {
      return new Errors.BadResponseError(err.message, err.data);
    }
    case 'BaseError': {
      return new Errors.BaseError(err.message, err.code, err.type, err.data);
    }
    case 'BusinessError': {
      return new Errors.BusinessError(err.message, err.data);
    }
    case 'DomainError': {
      return new Errors.DomainError(err.message, err.data);
    }
    case 'HTTPClientError': {
      return new Errors.HTTPClientError(err.message, err.code, err.data);
    }
    case 'NotFoundError': {
      return new Errors.NotFoundError(err.message);
    }
    case 'ServerTemporarilyUnavailableError': {
      return new Errors.ServerTemporarilyUnavailableError(err.message, err.data);
    }
    case 'ServerError': {
      return new Errors.ServerError(err.message, err.data);
    }
    case 'UnauthorizedError': {
      return new Errors.UnauthorizedError(err.message, err.data);
    }
    case 'ValidationError': {
      return new Errors.ValidationError(err.message, err.type, err.data);
    }
    case 'UnknownError':
    default: {
      return new Errors.UnknownError(err.message, error);
    }
  }
}
