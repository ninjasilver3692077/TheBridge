import { fieldError, notice } from "../../styles/ui.js";
import ExchangeBookOption from "./ExchangeBookOption.jsx";

function ExchangeBookOptions({
  books,
  selectedBookId,
  error,
  onChange,
}) {
  if (!books.length) {
    return (
      <div className={`mt-6 ${notice.warning}`}>
        <p className="text-sm font-semibold">
          You have no available books to offer
        </p>

        <p className="mt-1 text-sm leading-6 opacity-90">
          Add an available book to your library before requesting an exchange.
        </p>
      </div>
    );
  }

  return (
    <fieldset
      className="mt-6"
      aria-describedby={error ? "exchange-offer-error" : undefined}
    >
      <legend className="text-sm font-semibold text-ink">
        Your available books
      </legend>

      <div className="mt-3 space-y-2">
        {books.map((book) => (
          <ExchangeBookOption
            key={book.id}
            book={book}
            checked={selectedBookId === book.id}
            onChange={onChange}
          />
        ))}
      </div>

      {error && (
        <p
          id="exchange-offer-error"
          role="alert"
          className={fieldError}
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}

export default ExchangeBookOptions;
