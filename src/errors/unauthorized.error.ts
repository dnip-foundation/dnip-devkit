import { GenericObject } from '../index.js';
import { BaseError } from './base.error.js';

export class UnauthorizedError extends BaseError {
  constructor(msg: string, data?: GenericObject) {
    if (data != null) {
      super(msg, 401, 'UNAUTHORIZED', data);
    } else {
      super(msg, 401, 'UNAUTHORIZED');
    }
  }
}
