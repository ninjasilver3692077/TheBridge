import { buttonSecondary } from "../../styles/ui.js";
import ErrorState from "../ErrorState.jsx";
import LoadingState from "../LoadingState.jsx";
import ListingCard from "./ListingCard.jsx";

function ListingGrid({
  listings,
  status,
  error,
  hasMore,
  loadingMore,
  loadMoreError,
  onReset,
  onRetry,
  onSelect,
  onLoadMore,
}) {
  if (listings.length === 0 && status === "loading") {
    return (
      <LoadingState
        title="Loading listings..."
        message="Fetching the books shared by your community."
      />
    );
  }

  if (listings.length === 0 && status === "error") {
    return (
      <ErrorState
        title="We could not load the listings"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-muted px-6 py-16 text-center">
        <h2 className="text-lg font-semibold text-ink">
          No listings match your filters
        </h2>

        <p className="mt-2 text-sm text-ink-muted">
          Try another title, author, or ISBN, or remove some filters.
        </p>

        <button type="button" onClick={onReset} className={`mt-6 ${buttonSecondary}`}>
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="community-listings-title" aria-busy={status === "loading"}>
      <h2 id="community-listings-title" className="sr-only">
        Books shared on TheBridge
      </h2>

      <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} onSelect={onSelect} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className={buttonSecondary}
          >
            {loadingMore ? "Loading..." : "Show more listings"}
          </button>

          {loadMoreError && (
            <p role="alert" className="text-sm text-ink-muted">
              {loadMoreError}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default ListingGrid;
