import { useState } from "react";
import { useDialogFocus } from "../../hooks/useDialogFocus.js";
import { ApiError } from "../../services/apiClient.js";
import { withdrawListing } from "../../services/listings.js";
import { buttonPrimary, buttonSecondary, notice } from "../../styles/ui.js";

function WithdrawListingDialog({ book, onClose, onWithdrawn, onConflict }) {
  const [submitting, setSubmitting] = useState(false);
  const [conflicted, setConflicted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { dialogRef, handleKeyDown } = useDialogFocus(true, onClose);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      await withdrawListing(book.listingId);
      onWithdrawn();
    } catch (requestError) {
      const isConflict = requestError instanceof ApiError && requestError.status === 409;
      setSubmitError(requestError?.message || "We could not withdraw this listing.");
      setConflicted(isConflict);
      setSubmitting(false);
      if (isConflict) onConflict();
    }
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
        aria-labelledby="withdraw-listing-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="w-full max-w-lg rounded-2xl border border-line bg-surface-raised p-6 shadow-2xl focus:outline-none sm:p-7"
      >
        <h2
          id="withdraw-listing-title"
          className="text-2xl font-bold tracking-tight text-ink"
        >
          Withdraw listing
        </h2>

        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {book.title} will be taken off the marketplace. Pending requests will
          be rejected and the book returns to your library, available to
          publish again.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {submitError && (
            <p role="alert" className={`mt-4 text-sm ${notice.danger}`}>
              {submitError}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className={buttonSecondary}>
              {conflicted ? "Close" : "Cancel"}
            </button>
            {!conflicted && (
              <button type="submit" disabled={submitting} className={buttonPrimary}>
                {submitting ? "Withdrawing..." : "Withdraw listing"}
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

export default WithdrawListingDialog;
