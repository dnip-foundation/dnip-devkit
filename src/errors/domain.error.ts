import { BaseError } from './base.error.js';

export class DomainError extends BaseError {
  constructor(message: string) {
    super(`[domain] ${message}`);
    this.code = 475;
  }
}
