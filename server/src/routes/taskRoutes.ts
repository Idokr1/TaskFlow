import { Router } from 'express';
import type { TaskController } from '../controllers/taskController';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Builds the /tasks router.
 *
 * Receives the controller via dependency injection so wiring lives in `app.ts`,
 * not buried inside route files. This makes the dependency graph easy to read
 * top-down.
 */
export function buildTaskRoutes(controller: TaskController): Router {
  const router = Router();

  router.get('/', asyncHandler(controller.list));
  router.get('/:id', asyncHandler(controller.getById));
  router.post('/', asyncHandler(controller.create));
  router.patch('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.remove));

  return router;
}
