import { useCallback, useEffect, useRef, useState } from 'react';
import * as taskApi from '../services/taskApi';
import { ApiError } from '../utils/apiClient';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';

/**
 * Single source of truth for the task list, loading flag, and error message.
 *
 * Design choices:
 *   - All mutations refetch on success (simple + obviously correct). Optimistic
 *     updates would speed up the UI but obscure the data-flow story.
 *   - The hook aborts the in-flight list request on unmount to avoid setting
 *     state on an unmounted component.
 *   - Errors are stored as user-friendly strings; the UI never deals with
 *     raw response objects.
 */

export interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (input: CreateTaskInput) => Promise<void>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

function toUserMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tracks whether the component is still mounted so async callbacks can
  // skip setState calls after unmount.
  const mountedRef = useRef<boolean>(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchTasks = useCallback(async (signal?: AbortSignal): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskApi.listTasks(signal);
      if (mountedRef.current) setTasks(data);
    } catch (err) {
      // Don't surface errors caused by intentional aborts (e.g., unmount).
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (mountedRef.current) setError(toUserMessage(err));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Initial load + cleanup
  useEffect(() => {
    const controller = new AbortController();
    void fetchTasks(controller.signal);
    return () => controller.abort();
  }, [fetchTasks]);

  const refresh = useCallback(() => fetchTasks(), [fetchTasks]);

  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<void> => {
      setError(null);
      try {
        await taskApi.createTask(input);
        await fetchTasks();
      } catch (err) {
        if (mountedRef.current) setError(toUserMessage(err));
        throw err;
      }
    },
    [fetchTasks],
  );

  const updateTask = useCallback(
    async (id: string, input: UpdateTaskInput): Promise<void> => {
      setError(null);
      try {
        await taskApi.updateTask(id, input);
        await fetchTasks();
      } catch (err) {
        if (mountedRef.current) setError(toUserMessage(err));
        throw err;
      }
    },
    [fetchTasks],
  );

  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        await taskApi.deleteTask(id);
        await fetchTasks();
      } catch (err) {
        if (mountedRef.current) setError(toUserMessage(err));
        throw err;
      }
    },
    [fetchTasks],
  );

  const clearError = useCallback(() => setError(null), []);

  return { tasks, loading, error, createTask, updateTask, deleteTask, refresh, clearError };
}
