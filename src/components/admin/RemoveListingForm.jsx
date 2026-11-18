import { useState } from "react";
import { REASON_MAX_LENGTH, removeAdminListing } from "../../services/admin.js";
import {
  buttonPrimary,
  buttonSecondary,
  fieldError,
  fieldLabel,
  inputBase,
  notice,
} from "../../styles/ui.js";

function RemoveListingForm({ listing, onClose, onRemoved }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reasonError, setReasonError] = useState("");

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
  );
}

export default RemoveListingForm;
