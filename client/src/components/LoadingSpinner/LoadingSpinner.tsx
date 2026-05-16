import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  label?: string;
}

/**
 * Minimal accessible loading indicator. The visible label is also used as
 * the `aria-label`, so screen readers announce the loading state.
 */
export function LoadingSpinner({ label = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="loading-spinner" role="status" aria-live="polite">
      <span className="loading-spinner__dot" aria-hidden="true" />
      <span className="loading-spinner__label">{label}</span>
    </div>
  );
}
