import { BaseError } from './base.error.js';

export class NotFoundError extends BaseError {
  constructor(msg: string) {
    super(msg, 404, 'NOT_FOUND');
  }
}
