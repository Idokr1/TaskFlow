import './ErrorBanner.css';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

/**
 * Displays a user-facing error message with an optional dismiss button.
 * Uses role="alert" so assistive tech announces the error immediately.
 */
export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="error-banner" role="alert">
      <span className="error-banner__icon" aria-hidden="true">!</span>
      <span className="error-banner__message">{message}</span>
      {onDismiss && (
        <button
          type="button"
          className="error-banner__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
}
