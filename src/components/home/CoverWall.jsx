import { useCallback } from "react";
import { useApiResource } from "../../hooks/useApiResource.js";
import { initialListingFilters } from "../../services/listingFilters.js";
import { fetchListings } from "../../services/listings.js";

const COVER_WALL_SIZE = 48;

function CoverWall() {
  const load = useCallback(
    (signal) => fetchListings(initialListingFilters, { limit: COVER_WALL_SIZE, signal }),
    [],
  );
  const { data } = useApiResource(load);
  const covers = (data?.listings ?? []).filter((listing) => listing.cover);

  return (
    <div className="grid h-full scale-105 grid-cols-4 content-start gap-2 p-2 blur-[2px] saturate-[.85] sm:grid-cols-6 lg:grid-cols-8">
      {covers.map((listing) => (
        <img
          key={listing.id}
          src={listing.cover}
          alt=""
          loading="lazy"
          className="aspect-[2/3] w-full rounded-md bg-surface-muted object-cover"
        />
      ))}
    </div>
  );
}

export default CoverWall;
