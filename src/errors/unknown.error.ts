import { BaseError } from './base.error.js';

export class UnknownError extends BaseError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(msg: string, data?: any) {
    if (data != null) {
      super(msg, 500, 'UKNOWN', data);
    } else {
      super(msg, 500, 'UKNOWN');
    }
  }
}
