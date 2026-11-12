import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useApiResource } from "../../hooks/useApiResource.js";
import { initialListingFilters } from "../../services/listingFilters.js";
import { fetchListings } from "../../services/listings.js";
import { buttonGhost, sectionTitle } from "../../styles/ui.js";
import ErrorState from "../ErrorState.jsx";
import LoadingState from "../LoadingState.jsx";
import ListingCard from "../marketplace/ListingCard.jsx";

function FeaturedListings() {
  const load = useCallback(
    (signal) => fetchListings(initialListingFilters, { limit: 4, signal }),
    [],
  );
  const { status, data, error, reload } = useApiResource(load);

  return (
    <section aria-labelledby="featured-listings-title" className="mt-16 lg:mt-20">
      <div className="flex items-end justify-between gap-4">
        <h2 id="featured-listings-title" className={sectionTitle}>
          Recently shared
        </h2>

        <Link to="/marketplace" className={`-mr-3 ${buttonGhost}`}>
          View all listings
        </Link>
      </div>

      <div className="mt-6">
        {status === "loading" && (
          <LoadingState
            title="Loading listings..."
            message="Fetching the latest books shared by your community."
          />
        )}

        {status === "error" && (
          <ErrorState
            title="We could not load the listings"
            message={error}
            onRetry={reload}
          />
        )}

        {status === "success" && data.listings.length === 0 && (
          <p className="rounded-2xl bg-surface-muted px-6 py-12 text-center text-sm text-ink-muted">
            No books have been shared yet. Be the first to add one.
          </p>
        )}

        {status === "success" && data.listings.length > 0 && (
          <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedListings;
