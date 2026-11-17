import { buttonSecondary } from "../../styles/ui.js";

function ListingGridEmpty({ onReset }) {
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

export default ListingGridEmpty;
