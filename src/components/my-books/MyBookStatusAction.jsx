import { Link } from "react-router-dom";
import { buttonSecondary } from "../../styles/ui.js";
import ActivityNote from "./ActivityNote.jsx";
import PublishedBookStatus from "./PublishedBookStatus.jsx";

function MyBookStatusAction({ book, onWithdraw }) {
  if (book.status === "Available") {
    if (book.activityStatus) {
      return <ActivityNote book={book} />;
    }

    return (
      <Link
        to={`/create-listing?book=${encodeURIComponent(book.id)}`}
        className={`w-full ${buttonSecondary}`}
      >
        Create Listing
      </Link>
    );
  }

  if (book.status === "Published") {
    return <PublishedBookStatus book={book} onWithdraw={onWithdraw} />;
  }

  if (book.status === "Borrowed") {
    return (
      <div className="rounded-xl border border-line bg-surface-muted p-3 text-sm text-ink-muted">
        <p className="font-semibold text-ink">Borrowed, not yours</p>
        <p className="mt-1">
          This book belongs to{" "}
          <span className="font-semibold text-ink">
            {book.borrowedFromName || "another member"}
          </span>
          . You cannot list, edit or delete it. It leaves your library when
          the owner confirms the return.
        </p>
      </div>
    );
  }

  if (book.status === "Loaned") {
    return (
      <p className="text-sm text-ink-muted">
        Loaned to{" "}
        <span className="font-semibold text-ink">
          {book.loanedTo || "Member"}
        </span>
      </p>
    );
  }

  return null;
}

export default MyBookStatusAction;
