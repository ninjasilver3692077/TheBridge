import { focusRing, notice } from "../../styles/ui.js";
import DesiredBookResultList from "./DesiredBookResultList.jsx";

function DesiredBookResults({ search, onSelect }) {
  if (search.status === "loading") {
    return (
      <p className="mt-3 text-sm font-medium text-ink-muted" role="status">
        Searching the catalog...
      </p>
    );
  }

  if (search.status === "error") {
    return (
      <div className={`mt-3 ${notice.danger}`} role="alert">
        <p className="text-sm font-semibold">We could not reach the catalog.</p>
        <button
          type="button"
          onClick={search.retrySearch}
          className={`mt-2 rounded-md text-sm font-semibold underline underline-offset-4 ${focusRing}`}
        >
          Try again
        </button>
      </div>
    );
  }

  if (search.status === "no-results") {
    return (
      <p className="mt-3 text-sm text-ink-muted" role="status">
        No books found for "{search.submittedQuery}".
      </p>
    );
  }

  if (search.status !== "results") {
    return null;
  }

  return (
    <DesiredBookResultList
      results={search.results}
      savedAt={search.savedAt}
      onRetry={search.retrySearch}
      onSelect={onSelect}
    />
  );
}

export default DesiredBookResults;
