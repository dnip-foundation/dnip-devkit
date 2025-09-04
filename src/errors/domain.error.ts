import { GenericObject } from '../interfaces/common.interface.js';
import { BaseError } from './base.error.js';

export class DomainError extends BaseError {
  constructor(message: string, data?: GenericObject) {
    super(`[domain] ${message}`);
    this.code = 475;
    if (data != null) this.data = data;
  }
}
