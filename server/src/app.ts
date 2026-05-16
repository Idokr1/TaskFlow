import express, { type Express } from 'express';
import cors from 'cors';

import { config } from './config/env';
import { InMemoryTaskRepository } from './repositories/taskRepository';
import { TaskService } from './services/taskService';
import { TaskController } from './controllers/taskController';
import { buildApiRouter } from './routes';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

/**
 * Builds and returns the Express application.
 *
 * Wires the dependency graph top-down:
 *   repository → service → controller → router → app
 *
 * Kept separate from `index.ts` (which actually listens on a port) so the
 * app object could be exercised by tests or imported by a different entry
 * point without binding to a port.
 */
export function createApp(): Express {
  const app = express();

  // Core middleware
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  // Composition root: build dependency graph
  const taskRepository = new InMemoryTaskRepository();
  const taskService = new TaskService(taskRepository);
  const taskController = new TaskController(taskService);

  // Liveness probe — useful for verifying the server is up
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // API routes
  app.use('/api', buildApiRouter(taskController));

  // 404 + global error handler MUST be registered last
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
