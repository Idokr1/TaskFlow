import type { ITaskRepository } from '../repositories/ITaskRepository';
import type { Task, CreateTaskDTO, UpdateTaskDTO } from '../types/task';
import { NotFoundError } from '../types/errors';

/**
 * Application service for the Task resource.
 *
 * Holds business logic and translates "not found" into a domain error.
 * Knows nothing about HTTP — could be reused from a CLI, a GraphQL resolver,
 * or a background worker.
 */
export class TaskService {
  constructor(private readonly repo: ITaskRepository) {}

  listTasks(): Promise<Task[]> {
    return this.repo.findAll();
  }

  async getTask(id: string): Promise<Task> {
    const task = await this.repo.findById(id);
    if (!task) throw new NotFoundError('Task', id);
    return task;
  }

  createTask(input: CreateTaskDTO): Promise<Task> {
    return this.repo.create(input);
  }

  async updateTask(id: string, input: UpdateTaskDTO): Promise<Task> {
    const updated = await this.repo.update(id, input);
    if (!updated) throw new NotFoundError('Task', id);
    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new NotFoundError('Task', id);
  }
}
