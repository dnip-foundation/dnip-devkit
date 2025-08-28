import { GenericObject } from '../index.js';
import { BaseError } from './base.error.js';

export class BadResponseError extends BaseError {
  constructor(msg: string, data?: GenericObject) {
    if (data != null) {
      super(msg, 500, 'BAD_RESPONSE', data);
    } else {
      super(msg, 500, 'BAD_RESPONSE');
    }
  }
}
