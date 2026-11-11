import { buttonPrimary, notice } from "../styles/ui.js";

function ErrorState({ title = "We could not load the books", message, onRetry }) {
  return (
    <div
      className={`flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center ${notice.danger}`}
      role="alert"
    >
      <svg
        className="h-8 w-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6M12 17h.01" />
      </svg>

      <h2 className="mt-4 text-lg font-semibold text-ink">{title}</h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">
        {message || "Please check your connection and try again."}
      </p>

      <button type="button" onClick={onRetry} className={`mt-6 ${buttonPrimary}`}>
        Try again
      </button>
    </div>
  );
}

export default ErrorState;
