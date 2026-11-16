import BookList from "../BookList.jsx";
import ErrorState from "../ErrorState.jsx";
import LoadingState from "../LoadingState.jsx";
import SavedDataNotice from "../catalog/SavedDataNotice.jsx";

function OpenLibraryResults({
  status,
  error,
  books,
  favorites,
  savedAt,
  onRetry,
  onToggle,
}) {
  if (status === "loading") {
    return <LoadingState />;
  }

  if (status === "error") {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  return (
    <>
      {savedAt && (
        <SavedDataNotice
          savedAt={savedAt}
          onRetry={onRetry}
          className="mb-6"
        />
      )}

      <BookList books={books} favorites={favorites} onToggleFavorite={onToggle} />
    </>
  );
}

export default OpenLibraryResults;
