import { useCallback, useState } from "react";
import { useApiResource } from "../../hooks/useApiResource.js";
import { useDialogFocus } from "../../hooks/useDialogFocus.js";
import { fetchMyBooks, isBookFree } from "../../services/myBooks.js";
import { sendRequest } from "../../services/requests.js";
import { buttonSecondary } from "../../styles/ui.js";
import ExchangeBookOptions from "./ExchangeBookOptions.jsx";
import RequestDialogActions from "./RequestDialogActions.jsx";
import RequestDialogHeader from "./RequestDialogHeader.jsx";
import RequestOfferRows from "./RequestOfferRows.jsx";

function ListingRequestDialog({ listing, onClose, onSent }) {
  const [selectedBookId, setSelectedBookId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { dialogRef, handleKeyDown } = useDialogFocus(true, onClose);

  const isExchange = listing.modality === "Exchange";
  const loadBooks = useCallback(
    async (signal) =>
      isExchange ? (await fetchMyBooks({ signal })).filter(isBookFree) : [],
    [isExchange],
  );
  const {
    status: booksStatus,
    data: books,
    error: booksError,
    reload: reloadBooks,
  } = useApiResource(loadBooks);
  const availableBooks = books ?? [];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isExchange && !selectedBookId) {
      setError("Select one of your available books to continue.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      await sendRequest(listing.id, isExchange ? selectedBookId : null);
      onSent();
      onClose();
    } catch (requestError) {
      setSubmitError(requestError?.message || "We could not send your request.");
      setSubmitting(false);
    }
  };

  const handleBookChange = (bookId) => {
    setSelectedBookId(bookId);
    setError("");
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#1B0C12]/55 p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-dialog-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface-raised p-6 shadow-2xl focus:outline-none sm:p-7"
      >
        <RequestDialogHeader listing={listing} onClose={onClose} />

        <RequestOfferRows listing={listing} />

        <form onSubmit={handleSubmit}>
          {isExchange && booksStatus === "loading" && (
            <p role="status" className="mt-6 text-sm text-ink-muted">
              Loading your available books...
            </p>
          )}

          {isExchange && booksStatus === "error" && (
            <div role="alert" className="mt-6">
              <p className="text-sm text-ink-muted">{booksError}</p>
              <button
                type="button"
                onClick={reloadBooks}
                className={`mt-3 ${buttonSecondary}`}
              >
                Try again
              </button>
            </div>
          )}

          {isExchange && booksStatus === "success" && (
            <ExchangeBookOptions
              books={availableBooks}
              selectedBookId={selectedBookId}
              error={error}
              onChange={handleBookChange}
            />
          )}

          <RequestDialogActions
            sendDisabled={
              submitting ||
              (isExchange && (booksStatus !== "success" || availableBooks.length === 0))
            }
            submitting={submitting}
            submitError={submitError}
            onCancel={onClose}
          />
        </form>
      </section>
    </div>
  );
}

function ListingRequestModal({ listing, open, onClose, onSent }) {
  if (!open) {
    return null;
  }

  return (
    <ListingRequestDialog listing={listing} onClose={onClose} onSent={onSent} />
  );
}

export default ListingRequestModal;
