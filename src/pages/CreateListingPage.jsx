import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import CreateListingForm from "../components/create-listing/CreateListingForm.jsx";
import ListingBookCard from "../components/create-listing/ListingBookCard.jsx";
import ListingSuccess from "../components/create-listing/ListingSuccess.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { useApiResource } from "../hooks/useApiResource.js";
import { publishListing } from "../services/listings.js";
import { resolveListingBook } from "../services/myBooks.js";
import {
  buttonGhost,
  eyebrow,
  notice as noticeStyles,
  pageLead,
  pageTitle,
  textLink,
} from "../styles/ui.js";

function CreateListingPage() {
  const [searchParams] = useSearchParams();
  const [published, setPublished] = useState(null);
  const requestedId = searchParams.get("book");
  const load = useCallback(
    (signal) => resolveListingBook(requestedId, { signal }),
    [requestedId],
  );
  const { status, data: resolved, error, reload } = useApiResource(load);
  const book = published ? published.book : resolved?.book ?? null;
  const notice = published ? null : resolved?.notice ?? null;

  const handlePublish = async ({ modality, values }) => {
    const listing = await publishListing(book.id, modality, values);
    setPublished({ listing, book });
  };

  return (
    <AppShell
      title="Create Listing"
      subtitle="Choose how you want to share your book"
    >
      <Link to="/my-books" className={`-ml-3 mb-6 ${buttonGhost}`}>
        ← My Books
      </Link>

      <header className="max-w-2xl">
        <p className={eyebrow}>Share a book</p>
        <h1 className={`mt-3 ${pageTitle}`}>Create Listing</h1>
        <p className={`mt-2 ${pageLead}`}>
          Choose how you want to share this book with your community.
        </p>
      </header>

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

      {book && (
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-14">
          <ListingBookCard book={book} />

          {published ? (
            <ListingSuccess listing={published.listing} />
          ) : (
            <CreateListingForm onPublish={handlePublish} />
          )}
        </div>
      )}
    </AppShell>
  );
}

export default CreateListingPage;
