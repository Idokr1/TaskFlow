import type { Task, CreateTaskDTO, UpdateTaskDTO } from '../types/task';

/**
 * Contract for any persistence implementation of the Task resource.
 *
 * The service layer depends on this interface, not on a concrete class.
 * Swapping the in-memory store for a real database means writing a new class
 * that implements this interface — no other file needs to change.
 */
export interface ITaskRepository {
  findAll(): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  create(input: CreateTaskDTO): Promise<Task>;
  update(id: string, input: UpdateTaskDTO): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
}
