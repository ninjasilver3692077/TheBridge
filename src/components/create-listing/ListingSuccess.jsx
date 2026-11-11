import { Link } from "react-router-dom";
import {
  buttonPrimary,
  buttonSecondary,
  notice,
  tone,
} from "../../styles/ui.js";
import ListingSuccessSummary from "./ListingSuccessSummary.jsx";

function ListingSuccess({ listing }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-xl font-bold ${tone.sage}`}
          aria-hidden="true"
        >
          ✓
        </span>

        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Listing published!
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Here is a summary of your listing.
          </p>
        </div>
      </div>

      <ListingSuccessSummary listing={listing} />

      <p className={`mt-6 text-xs ${notice.info}`}>
        Your listing is now available in the marketplace.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link to="/my-books" className={buttonSecondary}>
          Back to My Books
        </Link>

        <Link to={`/listing/${listing.id}`} className={buttonPrimary}>
          View Listing →
        </Link>
      </div>
    </section>
  );
}

export default ListingSuccess;
