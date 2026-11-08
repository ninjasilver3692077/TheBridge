import { useMemo } from "react";
import { getUniqueValues } from "../../services/listingFilters.js";
import { buttonGhost } from "../../styles/ui.js";
import FilterSelect from "./FilterSelect.jsx";
import ListingSearchField from "./ListingSearchField.jsx";
import MarketplaceIntro from "./MarketplaceIntro.jsx";
import ModalityFilter from "./ModalityFilter.tsx";

function ListingFilters({ listings, filters, resultCount, hasActiveFilters, onChange, onReset }) {
  const genres = useMemo(() => getUniqueValues(listings, "genre"), [listings]);
  const conditions = useMemo(
    () => getUniqueValues(listings, "condition"),
    [listings],
  );

  return (
    <div>
      <MarketplaceIntro />

      <form role="search" className="mt-8" onSubmit={(event) => event.preventDefault()}>
        <ListingSearchField
          value={filters.search}
          onChange={(value) => onChange("search", value)}
        />

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <ModalityFilter
            value={filters.modality}
            onChange={(modality) => onChange("modality", modality)}
          />

          <div className="grid grid-cols-2 gap-3 lg:w-[22rem]">
            <FilterSelect id="genre-filter" label="Genre" value={filters.genre} options={genres} onChange={(value) => onChange("genre", value)} />
            <FilterSelect id="condition-filter" label="Condition" value={filters.condition} options={conditions} onChange={(value) => onChange("condition", value)} />
          </div>
        </div>
      </form>

      <div className="mt-8 flex min-h-9 flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted" aria-live="polite">
          <span className="font-semibold text-ink">{resultCount}</span>{" "}
          {resultCount === 1 ? "listing" : "listings"} found
        </p>
        {hasActiveFilters && (
          <button type="button" onClick={onReset} className={`-mr-3 ${buttonGhost}`}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

export default ListingFilters;
