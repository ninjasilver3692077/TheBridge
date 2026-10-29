import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import CreateListingForm from "../components/create-listing/CreateListingForm.jsx";
import ListingBookCard from "../components/create-listing/ListingBookCard.jsx";
import ListingSuccess from "../components/create-listing/ListingSuccess.jsx";
import { resolveListingBook } from "../services/createListingBooks.js";
import { publishListing } from "../services/listingsStorage.js";
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
  const resolved = resolveListingBook(requestedId);
  const book = published ? published.book : resolved.book;
  const notice = published ? null : resolved.notice;

  const handlePublish = ({ modality, values }) => {
    const listing = publishListing(book, modality, values);
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

      {notice && (
        <aside className={`mt-6 ${noticeStyles.warning}`}>
          <p className="text-sm font-semibold">{notice.title}</p>
          <p className="mt-1 text-sm leading-6 opacity-90">{notice.text}</p>
        </aside>
      )}

      {!book ? (
        <div className="mt-8 rounded-2xl bg-surface-muted px-6 py-12 text-center">
          <p className="font-semibold text-ink">
            You do not have any available books to list.
          </p>
          <Link to="/add-book" className={`mt-3 inline-block text-sm ${textLink}`}>
            Add a book
          </Link>
        </div>
      ) : (
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
