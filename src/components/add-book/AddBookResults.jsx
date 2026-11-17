import { buttonGhost } from "../../styles/ui.js";
import SavedDataNotice from "../catalog/SavedDataNotice.jsx";
import AddBookResultCard from "./AddBookResultCard.jsx";

function AddBookResults({
  results,
  savedAt,
  submittedQuery,
  onClear,
  onRetry,
  onSelect,
}) {
  return (
    <div className="mt-10">
      {savedAt && (
        <SavedDataNotice savedAt={savedAt} onRetry={onRetry} className="mb-6" />
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">
          <span className="font-semibold text-ink">{results.length}</span>{" "}
          {results.length === 1 ? "book" : "books"} found for "
          {submittedQuery}"
        </p>

        <button type="button" onClick={onClear} className={`-mr-3 ${buttonGhost}`}>
          Clear
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {results.map((book) => (
          <AddBookResultCard
            key={book.id}
            book={book}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

export default AddBookResults;
