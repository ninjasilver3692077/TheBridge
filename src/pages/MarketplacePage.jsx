import { useState } from "react";
import AppShell from "../components/AppShell.jsx";
import CatalogSection from "../components/marketplace/CatalogSection.jsx";
import ListingFilters from "../components/marketplace/ListingFilters.jsx";
import ListingGrid from "../components/marketplace/ListingGrid.jsx";
import ListingQuickView from "../components/marketplace/ListingQuickView.jsx";
import ListingStats from "../components/marketplace/ListingStats.jsx";
import { useListingFilters } from "../hooks/useListingFilters.js";
import { useMarketplace } from "../hooks/useMarketplace.js";

function MarketplacePage() {
  const listingFilters = useListingFilters();
  const marketplace = useMarketplace();
  const [selectedListing, setSelectedListing] = useState(null);

  return (
    <AppShell
      title="Marketplace"
      subtitle="Books shared by people in your community"
    >
      <section>
        <ListingFilters
          facets={listingFilters.facets}
          filters={listingFilters.filters}
          resultCount={listingFilters.resultCount}
          hasActiveFilters={listingFilters.hasActiveFilters}
          onChange={listingFilters.updateFilter}
          onReset={listingFilters.resetFilters}
        />

        <div className="mt-4">
          <ListingGrid
            listings={listingFilters.listings}
            status={listingFilters.status}
            error={listingFilters.error}
            hasMore={listingFilters.hasMore}
            loadingMore={listingFilters.loadingMore}
            loadMoreError={listingFilters.loadMoreError}
            onReset={listingFilters.resetFilters}
            onRetry={listingFilters.reload}
            onSelect={setSelectedListing}
            onLoadMore={listingFilters.loadMore}
          />
        </div>

        {listingFilters.stats && (
          <div className="mt-10">
            <ListingStats stats={listingFilters.stats} />
          </div>
        )}
      </section>

      <CatalogSection marketplace={marketplace} />

      <ListingQuickView
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
      />
    </AppShell>
  );
}

export default MarketplacePage;
