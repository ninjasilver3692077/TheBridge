import BookCover from "../catalog/BookCover.tsx";

const MAX_RESULTS = 8;

function DesiredBookResultList({ results, onSelect }) {
  const visibleResults = results.slice(0, MAX_RESULTS);

  return (
    <div className="mt-3">
      <p className="text-xs text-ink-muted" role="status">
        Select the exact book you want ({visibleResults.length}{" "}
        {visibleResults.length === 1 ? "result" : "results"}).
      </p>

      <ul className="mt-2 max-h-[26rem] divide-y divide-line overflow-y-auto rounded-2xl border border-line bg-surface">
        {visibleResults.map((book) => (
          <li key={book.id}>
            <button
              type="button"
              onClick={() => onSelect(book)}
              className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-surface-muted focus:outline-none focus-visible:bg-wine-soft"
            >
              <BookCover
                src={book.coverUrl}
                title={book.title}
                className="h-16 w-11 shrink-0 rounded-md"
              />

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                  {book.title}
                </span>
                <span className="block truncate text-sm text-ink-muted">
                  {book.author}
                </span>
                {book.year && (
                  <span className="block text-xs text-ink-muted">
                    {book.year}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DesiredBookResultList;
