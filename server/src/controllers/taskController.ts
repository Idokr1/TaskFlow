import type { Request, Response } from 'express';
import type { TaskService } from '../services/taskService';
import {
  validateCreateTask,
  validateUpdateTask,
  validateId,
} from '../validators/taskValidators';

/**
 * HTTP controller for the Task resource.
 *
 * Responsibilities (and ONLY these):
 *   - extract raw input from req
 *   - pass it through validators
 *   - call the service
 *   - shape the response
 *
 * Notably, controllers never set HTTP error status codes manually — they
 * throw, and the global error handler converts the error into a response.
 */
export class TaskController {
  constructor(private readonly service: TaskService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const tasks = await this.service.listTasks();
    res.status(200).json({ data: tasks });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = validateId(req.params.id);
    const task = await this.service.getTask(id);
    res.status(200).json({ data: task });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const dto = validateCreateTask(req.body);
    const created = await this.service.createTask(dto);
    res.status(201).json({ data: created });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = validateId(req.params.id);
    const dto = validateUpdateTask(req.body);
    const updated = await this.service.updateTask(id, dto);
    res.status(200).json({ data: updated });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const id = validateId(req.params.id);
    await this.service.deleteTask(id);
    res.status(204).send();
  };
}
