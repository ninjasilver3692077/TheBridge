import FavoritesSection from "../FavoritesSection.jsx";
import MarketplaceSearchPanel from "./MarketplaceSearchPanel.jsx";
import OpenLibraryResults from "./OpenLibraryResults.jsx";

function CatalogSection({ marketplace }) {
  return (
    <div className="mt-20 grid grid-cols-1 gap-10 border-t border-line pt-14 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section>
        <MarketplaceSearchPanel
          searchInput={marketplace.searchInput}
          searchError={marketplace.searchError}
          status={marketplace.status}
          onChange={marketplace.handleSearchChange}
          onSubmit={marketplace.handleSearchSubmit}
          onSearch={marketplace.runSearch}
        />

        <div className="mt-8">
          {marketplace.status === "success" && (
            <p className="mb-4 text-sm text-ink-muted">
              Showing catalog results for{" "}
              <span className="font-semibold text-ink">
                “{marketplace.activeQuery}”
              </span>
            </p>
          )}

          <OpenLibraryResults
            status={marketplace.status}
            error={marketplace.error}
            books={marketplace.books}
            favorites={marketplace.favorites}
            savedAt={marketplace.savedAt}
            onRetry={() => marketplace.runSearch(marketplace.activeQuery)}
            onToggle={marketplace.toggleFavorite}
          />
        </div>
      </section>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <FavoritesSection
          favorites={marketplace.favorites}
          notice={marketplace.favoritesNotice}
          onToggleFavorite={marketplace.toggleFavorite}
        />
      </aside>
    </div>
  );
}

export default CatalogSection;
