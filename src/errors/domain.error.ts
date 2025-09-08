import { GenericObject } from '../interfaces/common.js';
import { BaseError } from './base.error.js';

export class DomainError extends BaseError {
  constructor(message: string, type?: string, data?: GenericObject) {
    super(`[domain] ${message}`);
    this.code = 475;
    if (type != null) this.type = type;
    if (data != null) this.data = data;
  }
}
