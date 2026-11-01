import { useState } from "react";
import { useDialogFocus } from "../../hooks/useDialogFocus.js";
import ExchangeBookOptions from "./ExchangeBookOptions.jsx";
import RequestDialogActions from "./RequestDialogActions.jsx";
import RequestDialogHeader from "./RequestDialogHeader.jsx";
import RequestOfferRows from "./RequestOfferRows.jsx";
import { loadAvailableExchangeBooks } from "../../services/listingRequest.js";
import { addSentRequest } from "../../services/requestsStorage.js";

function ListingRequestModal({ listing, open, onClose, onSent }) {
  const [selectedBookId, setSelectedBookId] = useState("");
  const [error, setError] = useState("");
  const { dialogRef, handleKeyDown } = useDialogFocus(open, onClose);

  if (!open) {
    return null;
  }

  const isExchange = listing.modality === "Exchange";
  const availableBooks = isExchange ? loadAvailableExchangeBooks() : [];

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isExchange && !selectedBookId) {
      setError("Select one of your available books to continue.");
      return;
    }

    addSentRequest({
      listing,
      offeredBook: availableBooks.find((book) => book.id === selectedBookId),
    });
    onSent();
    onClose();
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
          {isExchange && (
            <ExchangeBookOptions
              books={availableBooks}
              selectedBookId={selectedBookId}
              error={error}
              onChange={handleBookChange}
            />
          )}

          <RequestDialogActions
            sendDisabled={isExchange && availableBooks.length === 0}
            onCancel={onClose}
          />
        </form>
      </section>
    </div>
  );
}

export default ListingRequestModal;
