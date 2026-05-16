import { useMemo, useState } from 'react';
import { useTasks } from './hooks/useTasks';
import { TaskForm } from './components/TaskForm/TaskForm';
import { TaskList } from './components/TaskList/TaskList';
import { LoadingSpinner } from './components/LoadingSpinner/LoadingSpinner';
import { ErrorBanner } from './components/ErrorBanner/ErrorBanner';
import {
  TaskFilters,
  type StatusFilter,
  type SortOption,
} from './components/TaskFilters/TaskFilters';
import type { Task, TaskPriority } from './types/task';
import './App.css';

/**
 * Root component.
 *
 * Holds the filter/sort UI state and derives the visible task list from the
 * full list returned by `useTasks`. The hook stays storage-only; presentation
 * concerns (which tasks are shown, in what order) live here.
 */

const PRIORITY_RANK: Record<TaskPriority, number> = { low: 0, medium: 1, high: 2 };

export default function App() {
  const {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    clearError,
  } = useTasks();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');

  const visibleTasks = useMemo(
    () => sortTasks(filterTasks(tasks, statusFilter), sortBy),
    [tasks, statusFilter, sortBy],
  );

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">TaskFlow</h1>
        <p className="app__subtitle">A small task manager</p>
      </header>

      <main className="app__main">
        {error && <ErrorBanner message={error} onDismiss={clearError} />}

        <TaskForm
          onCreate={createTask}
          onClearGlobalError={clearError}
          disabled={loading}
        />

        <section className="app__list-section" aria-labelledby="task-list-heading">
          <div className="app__list-header">
            <h2 id="task-list-heading" className="app__list-title">
              Tasks
            </h2>
            {loading && <LoadingSpinner />}
          </div>

          <TaskFilters
            statusFilter={statusFilter}
            sortBy={sortBy}
            onStatusFilterChange={setStatusFilter}
            onSortChange={setSortBy}
            totalCount={tasks.length}
            visibleCount={visibleTasks.length}
          />

          <TaskList
            tasks={visibleTasks}
            emptyMessage={
              tasks.length === 0
                ? 'No tasks yet — create one above to get started.'
                : 'No tasks match the current filter.'
            }
            onStatusChange={(id, status) => updateTask(id, { status })}
            onPriorityChange={(id, priority) => updateTask(id, { priority })}
            onDelete={deleteTask}
          />
        </section>
      </main>
    </div>
  );
}

function filterTasks(tasks: Task[], filter: StatusFilter): Task[] {
  if (filter === 'all') return tasks;
  return tasks.filter((t) => t.status === filter);
}

function sortTasks(tasks: Task[], sortBy: SortOption): Task[] {
  // Copy first — Array.prototype.sort mutates.
  const copy = [...tasks];
  switch (sortBy) {
    case 'created_desc':
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'created_asc':
      return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case 'priority_desc':
      return copy.sort(
        (a, b) =>
          PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] ||
          b.createdAt.localeCompare(a.createdAt),
      );
    case 'priority_asc':
      return copy.sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          b.createdAt.localeCompare(a.createdAt),
      );
  }
}
