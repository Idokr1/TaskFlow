import { randomUUID } from 'crypto';
import type { ITaskRepository } from './ITaskRepository';
import type { Task, CreateTaskDTO, UpdateTaskDTO } from '../types/task';

/**
 * In-memory implementation of ITaskRepository.
 *
 * Backed by a Map keyed by task id. All operations are async to match the
 * interface — this keeps callers identical whether the repo is in-memory
 * or talks to a real database.
 *
 * Data is lost on process restart.
 */
export class InMemoryTaskRepository implements ITaskRepository {
  private readonly store = new Map<string, Task>();

  async findAll(): Promise<Task[]> {
    // Sorted newest-first so the UI shows recently created tasks at the top.
    return Array.from(this.store.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async findById(id: string): Promise<Task | null> {
    return this.store.get(id) ?? null;
  }

  async create(input: CreateTaskDTO): Promise<Task> {
    const task: Task = {
      id: randomUUID(),
      title: input.title,
      description: input.description ?? '',
      status: input.status ?? 'pending',
      priority: input.priority ?? 'medium',
      createdAt: new Date().toISOString(),
    };
    this.store.set(task.id, task);
    return task;
  }

  async update(id: string, input: UpdateTaskDTO): Promise<Task | null> {
    const existing = this.store.get(id);
    if (!existing) return null;

    const updated: Task = { ...existing };
    if (input.title !== undefined) updated.title = input.title;
    if (input.description !== undefined) updated.description = input.description;
    if (input.status !== undefined) updated.status = input.status;
    if (input.priority !== undefined) updated.priority = input.priority;

    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}
