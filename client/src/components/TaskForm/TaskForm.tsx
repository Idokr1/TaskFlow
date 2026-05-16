import { useState, type FormEvent } from 'react';
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  type CreateTaskInput,
  type TaskStatus,
  type TaskPriority,
} from '../../types/task';
import { ApiError } from '../../utils/apiClient';
import './TaskForm.css';

interface TaskFormProps {
  onCreate: (input: CreateTaskInput) => Promise<void>;
  onClearGlobalError?: () => void;
  disabled?: boolean;
}

const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 2000;

/**
 * Controlled form for creating a new task.
 *
 * Performs minimal client-side validation (mirrors the server rules) for fast
 * feedback. The server is the authoritative validator — if the server rejects
 * the input, its specific error message is caught here and displayed inline
 * against the form (instead of as a global banner), so the user sees the
 * problem next to the inputs that caused it.
 */
export function TaskForm({ onCreate, onClearGlobalError, disabled = false }: TaskFormProps) {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  function reset() {
    setTitle('');
    setDescription('');
    setStatus('pending');
    setPriority('medium');
    setFormError(null);
  }

  function validateLocally(): string | null {
    const trimmed = title.trim();
    if (title.length > 0 && trimmed.length === 0) {
      return 'Title cannot consist only of whitespace';
    }
    if (trimmed.length === 0) {
      return 'Title is required';
    }
    if (trimmed.length < TITLE_MIN_LENGTH) {
      return `Title must be at least ${TITLE_MIN_LENGTH} characters`;
    }
    if (trimmed.length > TITLE_MAX_LENGTH) {
      return `Title must be at most ${TITLE_MAX_LENGTH} characters`;
    }
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      return `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`;
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || disabled) return;

    const localProblem = validateLocally();
    if (localProblem) {
      setFormError(localProblem);
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.length > 0 ? description : undefined,
        status,
        priority,
      });
      reset();
    } catch (err) {
      // The hook also stores the error globally; we display it inline here so
      // the user sees it next to the inputs that caused it. Wipe the global
      // banner so the same message isn't shown twice.
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to create task');
      }
      onClearGlobalError?.();
    } finally {
      setSubmitting(false);
    }
  }

  const isDisabled = disabled || submitting;

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <h2 className="task-form__title">Add a task</h2>

      <label className="task-form__field">
        <span className="task-form__label">
          Title <span className="task-form__hint">(min 3 characters)</span>
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          maxLength={TITLE_MAX_LENGTH}
          disabled={isDisabled}
          aria-invalid={formError !== null && formError.toLowerCase().includes('title')}
          required
        />
      </label>

      <label className="task-form__field">
        <span className="task-form__label">Description (optional)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more detail..."
          maxLength={DESCRIPTION_MAX_LENGTH}
          rows={3}
          disabled={isDisabled}
        />
      </label>

      <div className="task-form__row">
        <label className="task-form__field task-form__field--inline">
          <span className="task-form__label">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            disabled={isDisabled}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatus(s)}
              </option>
            ))}
          </select>
        </label>

        <label className="task-form__field task-form__field--inline">
          <span className="task-form__label">Priority</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            disabled={isDisabled}
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {formatPriority(p)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {formError && (
        <div className="task-form__error" role="alert">
          {formError}
        </div>
      )}

      <button type="submit" className="task-form__submit" disabled={isDisabled}>
        {submitting ? 'Adding...' : 'Add task'}
      </button>
    </form>
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
