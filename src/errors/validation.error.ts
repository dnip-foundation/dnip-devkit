import { GenericObject } from '../interfaces/common.js';
import { BaseError } from './base.error.js';

export class ValidationError extends BaseError {
  constructor(msg: string, type?: string, data?: GenericObject) {
    if (data != null) {
      super(msg, 422, type ?? 'VALIDATION_ERROR', data);
    } else {
      super(msg, 422, type ?? 'VALIDATION_ERROR');
    }
  }
}
