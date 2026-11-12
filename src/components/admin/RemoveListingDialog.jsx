import { useState } from "react";
import { useDialogFocus } from "../../hooks/useDialogFocus.js";
import { REASON_MAX_LENGTH, removeAdminListing } from "../../services/admin.js";
import {
  buttonPrimary,
  buttonSecondary,
  fieldError,
  fieldLabel,
  inputBase,
  notice,
} from "../../styles/ui.js";

function RemoveListingDialog({ listing, onClose, onRemoved }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reasonError, setReasonError] = useState("");
  const { dialogRef, handleKeyDown } = useDialogFocus(true, onClose);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!reason.trim()) {
      setReasonError("Enter the reason for removing this listing.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      await removeAdminListing(listing.id, reason);
      onRemoved();
    } catch (requestError) {
      setSubmitError(requestError?.message || "We could not remove this listing.");
      setSubmitting(false);
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
        aria-labelledby="remove-listing-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="w-full max-w-lg rounded-2xl border border-line bg-surface-raised p-6 shadow-2xl focus:outline-none sm:p-7"
      >
        <h2
          id="remove-listing-title"
          className="text-2xl font-bold tracking-tight text-ink"
        >
          Remove listing
        </h2>

        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {listing.book.title} by {listing.owner.name} will be removed from the
          marketplace. Pending requests are rejected and the owner sees your
          reason.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="removal-reason" className={`mt-6 ${fieldLabel}`}>
            Reason
          </label>
          <textarea
            id="removal-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setReasonError("");
            }}
            maxLength={REASON_MAX_LENGTH}
            rows={4}
            aria-invalid={Boolean(reasonError)}
            aria-describedby={reasonError ? "removal-reason-error" : undefined}
            className={`${inputBase} p-3`}
          />
          {reasonError && (
            <p id="removal-reason-error" className={fieldError}>
              {reasonError}
            </p>
          )}

          {submitError && (
            <p role="alert" className={`mt-4 text-sm ${notice.danger}`}>
              {submitError}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className={buttonSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={buttonPrimary}>
              {submitting ? "Removing..." : "Remove listing"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default RemoveListingDialog;
