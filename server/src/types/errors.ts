/**
 * Application error hierarchy.
 *
 * Every error thrown intentionally inside the app extends `AppError`.
 * The global `errorHandler` middleware uses `instanceof AppError` to decide
 * whether an error is safe to expose to the client and which HTTP status to use.
 *
 * Unknown errors are always logged and surfaced as a generic 500 — never
 * forwarded as-is, to avoid leaking internals.
 */

export type AppErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR';

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: AppErrorCode;

  constructor(message: string, statusCode: number, code: AppErrorCode) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id "${id}" not found`, 404, 'NOT_FOUND');
  }
}
