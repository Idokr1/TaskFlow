import type { RequestHandler } from 'express';

/**
 * Catch-all middleware for unmatched routes.
 *
 * Mounted *after* all real routes. Responds with the same JSON envelope as
 * the global error handler so clients see a single error shape everywhere.
 */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
};
