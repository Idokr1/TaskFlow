import type { RequestHandler } from 'express';

/**
 * Minimal request logger.
 *
 * Logs one line per request once the response has been sent, including
 * method, path, status, and duration. Deliberately simple — production apps
 * would use morgan/pino, but this keeps dependencies to a minimum.
 */
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // eslint-disable-next-line no-console
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
    );
  });
  next();
};
