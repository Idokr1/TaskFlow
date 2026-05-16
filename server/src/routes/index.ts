import { Router } from 'express';
import type { TaskController } from '../controllers/taskController';
import { buildTaskRoutes } from './taskRoutes';

/**
 * Aggregates all resource routers under the `/api` namespace.
 * Adding a new resource = one more line here.
 */
export function buildApiRouter(taskController: TaskController): Router {
  const router = Router();
  router.use('/tasks', buildTaskRoutes(taskController));
  return router;
}
