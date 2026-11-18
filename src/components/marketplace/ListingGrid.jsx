import ListingGridEmpty from "./ListingGridEmpty.jsx";
import ListingPagination from "./ListingPagination.jsx";
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
    return <ListingGridEmpty onReset={onReset} />;
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

      <ListingPagination
        hasMore={hasMore}
        loadingMore={loadingMore}
        loadMoreError={loadMoreError}
        onLoadMore={onLoadMore}
      />
    </section>
  );
}

export default ListingGrid;
