import { request } from '../utils/apiClient';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';

/**
 * Task API service — one function per endpoint.
 *
 * Components/hooks call these instead of `fetch` directly. This keeps the
 * URL/HTTP-method details in one file, so renaming an endpoint touches a
 * single line and nothing in the UI.
 */

const BASE = '/api/tasks';

export function listTasks(signal?: AbortSignal): Promise<Task[]> {
  return request<Task[]>(BASE, { signal });
}

export function getTask(id: string, signal?: AbortSignal): Promise<Task> {
  return request<Task>(`${BASE}/${encodeURIComponent(id)}`, { signal });
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  return request<Task>(BASE, { method: 'POST', body: input });
}

export function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  return request<Task>(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteTask(id: string): Promise<void> {
  return request<void>(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
