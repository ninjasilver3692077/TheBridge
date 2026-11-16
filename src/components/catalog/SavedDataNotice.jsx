import { buttonSecondarySm, notice } from "../../styles/ui.js";

function formatSavedAt(savedAt) {
  return new Date(savedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function SavedDataNotice({ savedAt, onRetry, className = "" }) {
  return (
    <div
      role="status"
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${notice.warning} ${className}`}
    >
      <div>
        <p className="text-sm font-semibold">Showing saved data</p>
        <p className="mt-1 text-sm leading-6 opacity-90">
          Open Library could not be reached. These results were saved on{" "}
          {formatSavedAt(savedAt)}.
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className={`w-fit shrink-0 ${buttonSecondarySm}`}
      >
        Try again
      </button>
    </div>
  );
}

export default SavedDataNotice;
