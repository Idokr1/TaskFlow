import { TaskItem } from '../TaskItem/TaskItem';
import type { Task, TaskStatus, TaskPriority } from '../../types/task';
import './TaskList.css';

interface TaskListProps {
  tasks: Task[];
  emptyMessage?: string;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onPriorityChange: (id: string, priority: TaskPriority) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Presentational list of tasks. Renders an empty-state message when
 * the list is empty so the UI never goes silent.
 */
export function TaskList({
  tasks,
  emptyMessage = 'No tasks yet — create one above to get started.',
  onStatusChange,
  onPriorityChange,
  onDelete,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="task-list__empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onStatusChange={onStatusChange}
          onPriorityChange={onPriorityChange}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
