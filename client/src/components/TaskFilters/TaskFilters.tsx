import { TASK_STATUSES, type TaskStatus } from '../../types/task';
import './TaskFilters.css';

export type StatusFilter = TaskStatus | 'all';
export type SortOption =
  | 'created_desc'
  | 'created_asc'
  | 'priority_desc'
  | 'priority_asc';

export const SORT_OPTIONS: ReadonlyArray<{ value: SortOption; label: string }> = [
  { value: 'created_desc', label: 'Newest first' },
  { value: 'created_asc', label: 'Oldest first' },
  { value: 'priority_desc', label: 'Priority (high → low)' },
  { value: 'priority_asc', label: 'Priority (low → high)' },
];

interface TaskFiltersProps {
  statusFilter: StatusFilter;
  sortBy: SortOption;
  onStatusFilterChange: (filter: StatusFilter) => void;
  onSortChange: (sort: SortOption) => void;
  totalCount: number;
  visibleCount: number;
}

/**
 * Filter + sort controls.
 *
 * Stateless — the actual filter/sort state lives in the parent so the
 * filtered list is computed there. This component is purely the UI.
 */
export function TaskFilters({
  statusFilter,
  sortBy,
  onStatusFilterChange,
  onSortChange,
  totalCount,
  visibleCount,
}: TaskFiltersProps) {
  const showFilteredCount = statusFilter !== 'all' && visibleCount !== totalCount;

  return (
    <div className="task-filters">
      <div className="task-filters__group">
        <label className="task-filters__field">
          <span className="task-filters__label">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
          >
            <option value="all">All</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatus(s)}
              </option>
            ))}
          </select>
        </label>

        <label className="task-filters__field">
          <span className="task-filters__label">Sort by</span>
          <select value={sortBy} onChange={(e) => onSortChange(e.target.value as SortOption)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="task-filters__count" aria-live="polite">
        {showFilteredCount
          ? `Showing ${visibleCount} of ${totalCount}`
          : `${totalCount} ${totalCount === 1 ? 'task' : 'tasks'}`}
      </p>
    </div>
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
