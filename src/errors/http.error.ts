import { BaseError } from './base.error.js';

export class HTTPClientError extends BaseError {
  constructor(message: string, code: number, data?: unknown) {
    if (data != null) {
      super(message, code, 'HTTP_CLIENT_ERROR', data);
    } else {
      super(message, code, 'HTTP_CLIENT_ERROR');
    }
  }
}
