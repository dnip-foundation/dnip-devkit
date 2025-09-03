/* eslint-disable max-classes-per-file */
import { GenericObject } from '../interfaces/common.interface.js';

class ExtendableError extends Error {
  constructor(message = '') {
    super(message);

    // extending Error is weird and does not propagate `message`
    Object.defineProperty(this, 'message', {
      configurable: true,
      enumerable: false,
      value: message,
      writable: true,
    });

    Object.defineProperty(this, 'name', {
      configurable: true,
      enumerable: false,
      value: this.constructor.name,
      writable: true,
    });

    if (Object.prototype.hasOwnProperty.call(Error, 'captureStackTrace')) {
      Error.captureStackTrace(this, this.constructor);
      return;
    }

    Object.defineProperty(this, 'stack', {
      configurable: true,
      enumerable: false,
      value: new Error(message).stack,
      writable: true,
    });
  }
}

export class BaseError extends ExtendableError {
  readonly dnip = true;

  code: number;
  type?: string;
  data?: GenericObject;

  constructor(message: string, code?: number, type?: string, data?: GenericObject) {
    super(message);
    this.code = code || 500;
    this.type = type;
    this.data = data;
  }
}
