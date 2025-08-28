import { BaseError } from './base.error.js';

export class ServerTemporarilyUnavailableError extends BaseError {
  constructor(message: string, data?: unknown) {
    if (data != null) {
      super(message, 503, 'SERVICE_TEMPORARILY_UNAVAILABLE', data);
    } else {
      super(message, 503, 'SERVICE_TEMPORARILY_UNAVAILABLE');
    }
  }
}
