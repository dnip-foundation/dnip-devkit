import { GenericObject } from '../index.js';
import { BaseError } from './base.error.js';

export class BadRequestError extends BaseError {
  constructor(msg: string, data?: GenericObject) {
    if (data != null) {
      super(msg, 400, 'BAD_REQUEST', data);
    } else {
      super(msg, 400, 'BAD_REQUEST');
    }
  }
}
