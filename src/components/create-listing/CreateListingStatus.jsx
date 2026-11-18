import { Link } from "react-router-dom";
import { notice as noticeStyles, textLink } from "../../styles/ui.js";
import ErrorState from "../ErrorState.jsx";
import LoadingState from "../LoadingState.jsx";

function CreateListingStatus({ state }) {
  const { status, published, error, reload, notice, book } = state;

  return (
    <>
      {status === "loading" && !published && (
        <div className="mt-8">
          <LoadingState
            title="Loading your books..."
            message="Finding the books you can list."
          />
        </div>
      )}

      {status === "error" && !published && (
        <div className="mt-8">
          <ErrorState
            title="We could not load your books"
            message={error}
            onRetry={reload}
          />
        </div>
      )}

      {notice && (
        <aside className={`mt-6 ${noticeStyles.warning}`}>
          <p className="text-sm font-semibold">{notice.title}</p>
          <p className="mt-1 text-sm leading-6 opacity-90">{notice.text}</p>
        </aside>
      )}

      {status === "success" && !book && (
        <div className="mt-8 rounded-2xl bg-surface-muted px-6 py-12 text-center">
          <p className="font-semibold text-ink">
            You do not have any available books to list.
          </p>
          <Link to="/add-book" className={`mt-3 inline-block text-sm ${textLink}`}>
            Add a book
          </Link>
        </div>
      )}
    </>
  );
}

export default CreateListingStatus;
