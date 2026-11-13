import { useState } from "react";
import { useDialogFocus } from "../../hooks/useDialogFocus.js";
import { deleteAdminMember } from "../../services/admin.js";
import { buttonPrimary, buttonSecondary, notice } from "../../styles/ui.js";

function DeleteMemberDialog({ member, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { dialogRef, handleKeyDown } = useDialogFocus(true, onClose);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      await deleteAdminMember(member.id);
      onDeleted();
    } catch (requestError) {
      setSubmitError(requestError?.message || "We could not delete this member account.");
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
        aria-labelledby="delete-member-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="w-full max-w-lg rounded-2xl border border-line bg-surface-raised p-6 shadow-2xl focus:outline-none sm:p-7"
      >
        <h2
          id="delete-member-title"
          className="text-2xl font-bold tracking-tight text-ink"
        >
          Delete member account
        </h2>

        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {member.name} ({member.email}) will be permanently deleted along with their
          library books, listings, and favorites, and their pending requests will be
          rejected.
        </p>

        <form onSubmit={handleSubmit} noValidate>
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
              {submitting ? "Deleting..." : "Delete account"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default DeleteMemberDialog;
