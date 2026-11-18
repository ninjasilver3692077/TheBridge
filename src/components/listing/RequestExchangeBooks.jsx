import { buttonSecondary } from "../../styles/ui.js";
import ExchangeBookOptions from "./ExchangeBookOptions.jsx";

function RequestExchangeBooks({ request }) {
  const {
    isExchange,
    booksStatus,
    booksError,
    reloadBooks,
    availableBooks,
    selectedBookId,
    error,
    handleBookChange,
  } = request;

  return (
    <>
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
    </>
  );
}

export default RequestExchangeBooks;
