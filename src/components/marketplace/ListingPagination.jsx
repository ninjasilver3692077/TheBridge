import { buttonSecondary } from "../../styles/ui.js";

function ListingPagination({ hasMore, loadingMore, loadMoreError, onLoadMore }) {
  return (
    <>
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
    </>
  );
}

export default ListingPagination;
