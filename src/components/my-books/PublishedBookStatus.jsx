import { Link } from "react-router-dom";
import { buttonSecondary, textLink } from "../../styles/ui.js";
import ActivityNote from "./ActivityNote.jsx";

function PublishedBookStatus({ book, onWithdraw }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-muted">
        Listed as {book.listingModality || "listing"} ·{" "}
        <Link to="/marketplace" className={textLink}>
          View Marketplace
        </Link>
      </p>
      {book.activityStatus && <ActivityNote book={book} />}
      {book.listingStatus === "Available" && (
        <button
          type="button"
          onClick={() => onWithdraw(book)}
          aria-label={`Withdraw listing for ${book.title}`}
          className={`w-full ${buttonSecondary}`}
        >
          Withdraw listing
        </button>
      )}
    </div>
  );
}

export default PublishedBookStatus;
