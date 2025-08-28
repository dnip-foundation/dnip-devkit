import { BaseError } from './base.error.js';

export class BadConfigError extends BaseError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(msg: string, data?: any) {
    if (data != null) {
      super(msg, 500, 'BAD_CONFIG', data);
    } else {
      super(msg, 500, 'BAD_CONFIG');
    }
  }
}
