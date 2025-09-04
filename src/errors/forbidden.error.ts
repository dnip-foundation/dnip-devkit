import { GenericObject } from '../index.js';
import { BaseError } from './base.error.js';

export class ForbiddenError extends BaseError {
  constructor(msg: string, type?: string, data?: GenericObject) {
    if (data != null) {
      super(msg, 403, type ?? 'FORBIDDEN', data);
    } else {
      super(msg, 403, type ?? 'FORBIDDEN');
    }
  }
}
