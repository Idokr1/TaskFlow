import { ValidationError } from '../types/errors';
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  isTaskStatus,
  isTaskPriority,
  type CreateTaskDTO,
  type UpdateTaskDTO,
  type TaskPriority,
} from '../types/task';

const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 2000;

/**
 * Hand-written validators for task inputs.
 *
 * Each function:
 *   - accepts an `unknown` (the raw, untrusted request body / path param);
 *   - narrows fields one at a time, throwing `ValidationError` on the first failure;
 *   - returns a fully-typed DTO on success.
 *
 * Why hand-written (no zod/joi):
 *   Hand-written rules keep every
 *   validation decision visible at the call site instead of hidden inside a library.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseTitle(raw: unknown, { required }: { required: boolean }): string | undefined {
  if (raw === undefined) {
    if (required) throw new ValidationError('title is required');
    return undefined;
  }
  if (typeof raw !== 'string') {
    throw new ValidationError('title must be a string');
  }
  // Reject titles that are non-empty but consist only of whitespace,
  // giving a specific message rather than a generic "too short" error.
  if (raw.length > 0 && raw.trim().length === 0) {
    throw new ValidationError('title cannot consist only of whitespace');
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('title must not be empty');
  }
  if (trimmed.length < TITLE_MIN_LENGTH) {
    throw new ValidationError(`title must be at least ${TITLE_MIN_LENGTH} characters`);
  }
  if (trimmed.length > TITLE_MAX_LENGTH) {
    throw new ValidationError(`title must be at most ${TITLE_MAX_LENGTH} characters`);
  }
  return trimmed;
}

function parseDescription(raw: unknown): string | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw !== 'string') {
    throw new ValidationError('description must be a string');
  }
  if (raw.length > DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(
      `description must be at most ${DESCRIPTION_MAX_LENGTH} characters`,
    );
  }
  return raw;
}

function parseStatus(raw: unknown): CreateTaskDTO['status'] | undefined {
  if (raw === undefined) return undefined;
  if (!isTaskStatus(raw)) {
    throw new ValidationError(
      `status must be one of: ${TASK_STATUSES.join(', ')}`,
    );
  }
  return raw;
}

function parsePriority(raw: unknown): TaskPriority | undefined {
  if (raw === undefined) return undefined;
  if (!isTaskPriority(raw)) {
    throw new ValidationError(
      `priority must be one of: ${TASK_PRIORITIES.join(', ')}`,
    );
  }
  return raw;
}

export function validateCreateTask(body: unknown): CreateTaskDTO {
  if (!isPlainObject(body)) {
    throw new ValidationError('Request body must be a JSON object');
  }

  // `parseTitle` with required:true throws on undefined, so the result is a string.
  const title = parseTitle(body.title, { required: true }) as string;
  const description = parseDescription(body.description);
  const status = parseStatus(body.status);
  const priority = parsePriority(body.priority);

  const dto: CreateTaskDTO = { title };
  if (description !== undefined) dto.description = description;
  if (status !== undefined) dto.status = status;
  if (priority !== undefined) dto.priority = priority;
  return dto;
}

export function validateUpdateTask(body: unknown): UpdateTaskDTO {
  if (!isPlainObject(body)) {
    throw new ValidationError('Request body must be a JSON object');
  }

  const title = parseTitle(body.title, { required: false });
  const description = parseDescription(body.description);
  const status = parseStatus(body.status);
  const priority = parsePriority(body.priority);

  const dto: UpdateTaskDTO = {};
  if (title !== undefined) dto.title = title;
  if (description !== undefined) dto.description = description;
  if (status !== undefined) dto.status = status;
  if (priority !== undefined) dto.priority = priority;

  if (Object.keys(dto).length === 0) {
    throw new ValidationError(
      'Update requires at least one of: title, description, status, priority',
    );
  }

  return dto;
}

export function validateId(raw: unknown): string {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new ValidationError('id path parameter must be a non-empty string');
  }
  return raw;
}
