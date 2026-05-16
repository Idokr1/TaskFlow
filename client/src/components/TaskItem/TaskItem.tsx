import { useState } from 'react';
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from '../../types/task';
import './TaskItem.css';

interface TaskItemProps {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onPriorityChange: (id: string, priority: TaskPriority) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Renders a single task row.
 *
 * Visual cues:
 *   - left border color reflects the status
 *   - a colored "priority" badge in the top-right is the at-a-glance signal
 *     for urgency (red = high, amber = medium, slate = low)
 *
 * The status and priority `<select>`s let the user change values inline.
 * A local `busy` flag disables interactive elements while a mutation is in
 * flight to avoid double-submissions.
 */
export function TaskItem({ task, onStatusChange, onPriorityChange, onDelete }: TaskItemProps) {
  const [busy, setBusy] = useState<boolean>(false);

  async function handleStatusChange(newStatus: TaskStatus) {
    if (busy || newStatus === task.status) return;
    setBusy(true);
    try {
      await onStatusChange(task.id, newStatus);
    } catch {
      // Error surfacing is handled by the parent hook.
    } finally {
      setBusy(false);
    }
  }

  async function handlePriorityChange(newPriority: TaskPriority) {
    if (busy || newPriority === task.priority) return;
    setBusy(true);
    try {
      await onPriorityChange(task.id, newPriority);
    } catch {
      // Error surfacing is handled by the parent hook.
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (busy) return;
    setBusy(true);
    try {
      await onDelete(task.id);
    } catch {
      // If the delete failed the component still exists; re-enable buttons.
      setBusy(false);
    }
    // On success the component is removed by the parent, so no setBusy(false).
  }

  return (
    <li
      className={`task-item task-item--status-${task.status} task-item--priority-${task.priority}`}
    >
      <div className="task-item__main">
        <div className="task-item__header">
          <h3 className="task-item__title">{task.title}</h3>
          <span
            className={`task-item__priority-badge task-item__priority-badge--${task.priority}`}
            aria-label={`Priority: ${formatPriority(task.priority)}`}
            title={`Priority: ${formatPriority(task.priority)}`}
          >
            {formatPriority(task.priority)}
          </span>
        </div>
        {task.description && <p className="task-item__description">{task.description}</p>}
        <p className="task-item__meta">Created {formatDate(task.createdAt)}</p>
      </div>

      <div className="task-item__actions">
        <label className="task-item__select-label">
          <span className="visually-hidden">Status</span>
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            disabled={busy}
            aria-label={`Status of "${task.title}"`}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatus(s)}
              </option>
            ))}
          </select>
        </label>

        <label className="task-item__select-label">
          <span className="visually-hidden">Priority</span>
          <select
            value={task.priority}
            onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
            disabled={busy}
            aria-label={`Priority of "${task.title}"`}
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {formatPriority(p)}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="task-item__delete"
          onClick={handleDelete}
          disabled={busy}
          aria-label={`Delete "${task.title}"`}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function formatStatus(status: TaskStatus): string {
  switch (status) {
    case 'pending':
      return 'To Do';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Done';
  }
}

function formatPriority(priority: TaskPriority): string {
  switch (priority) {
    case 'low':
      return 'Low';
    case 'medium':
      return 'Medium';
    case 'high':
      return 'High';
  }
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}
