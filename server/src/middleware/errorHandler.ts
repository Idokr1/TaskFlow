import type { ErrorRequestHandler } from 'express';
import { AppError } from '../types/errors';

/**
 * Global error-handling middleware.
 *
 * Translates any error reaching Express's error pipeline into a consistent
 * JSON envelope: `{ error: { code, message } }`.
 *
 *   - `AppError` instances are trusted: their statusCode/code/message are
 *     forwarded to the client.
 *   - Anything else is logged with its stack and surfaced as a generic 500.
 *     We never leak internal error messages to the client.
 *
 * Note: Express identifies error-handling middleware by its four-parameter
 * signature, so `_next` must remain in the signature even when unused.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // Unknown error — log full details server-side, hide them from the client.
  // eslint-disable-next-line no-console
  console.error('[errorHandler] Unhandled error:', err);

  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
};
