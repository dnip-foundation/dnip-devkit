import { BaseError } from './base.error.js';

export class ServerError extends BaseError {
  constructor(message: string, data?: unknown) {
    if (data != null) {
      super(message, 500, 'SERVER_ERROR', data);
    } else {
      super(message, 500, 'SERVER_ERROR');
    }
  }
}
