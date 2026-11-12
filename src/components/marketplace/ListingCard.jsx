import { useState } from "react";
import { Link } from "react-router-dom";
import { getListingOfferLabel } from "../../services/listingFilters.js";
import { badge, cardInteractive, modalityTone } from "../../styles/ui.js";

function ListingCard({ listing, headingLevel: Heading = "h3", onSelect }) {
  const [coverFailed, setCoverFailed] = useState(!listing.cover);

  return (
    <article className={`group relative overflow-hidden ${cardInteractive}`}>
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-muted">
        {coverFailed ? (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <span className="text-sm font-semibold text-ink-muted">
              {listing.title}
            </span>
          </div>
        ) : (
          <img
            src={listing.cover}
            alt={`Cover of ${listing.title}`}
            loading="lazy"
            onError={() => setCoverFailed(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        )}

        <span
          className={`absolute left-3 top-3 shadow-sm ${badge} ${modalityTone[listing.modality] ?? ""}`}
        >
          {listing.modality}
        </span>
      </div>

      <div className="p-4">
        <Heading className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
          {onSelect ? (
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={(event) => {
                event.currentTarget.focus();
                onSelect(listing);
              }}
              className="text-left after:absolute after:inset-0 focus:outline-none"
            >
              {listing.title}
            </button>
          ) : (
            <Link
              to={`/listing/${listing.id}`}
              className="after:absolute after:inset-0 focus:outline-none"
            >
              {listing.title}
            </Link>
          )}
        </Heading>

        <p className="mt-0.5 truncate text-sm text-ink-muted">
          {listing.author}
        </p>

        <p className="mt-3 truncate text-sm font-semibold text-ink">
          {getListingOfferLabel(listing)}
        </p>

        <p className="mt-0.5 truncate text-xs text-ink-muted">
          {[listing.condition, listing.owner].filter(Boolean).join(" · ")}
        </p>
      </div>
    </article>
  );
}

export default ListingCard;
