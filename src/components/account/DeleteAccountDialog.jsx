import { useState } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "../../hooks/useDialogFocus.js";
import { deleteOwnAccount, fieldFromServerMessage } from "../../services/auth.js";
import { buttonPrimary, buttonSecondary, notice } from "../../styles/ui.js";
import AuthField from "../auth/AuthField.jsx";

function DeleteAccountDialog({ onClose, onDeleted }) {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { dialogRef, handleKeyDown } = useDialogFocus(true, onClose);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!password) {
      setPasswordError("Enter your password.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await deleteOwnAccount({ password });
      onDeleted();
    } catch (requestError) {
      const message = requestError?.message || "We could not delete your account.";
      const mapped = fieldFromServerMessage(message);
      if (mapped && mapped.field === "password") {
        setPasswordError(mapped.message);
      } else {
        setSubmitError(message);
      }
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#1B0C12]/55 p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="w-full max-w-lg rounded-2xl border border-line bg-surface-raised p-6 shadow-2xl focus:outline-none sm:p-7"
      >
        <h2
          id="delete-account-title"
          className="text-2xl font-bold tracking-tight text-ink"
        >
          Delete account
        </h2>

        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Deleting your account permanently removes your library books, listings, and
          favorites, and rejects your pending requests. Enter your password to confirm.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <AuthField
            id="delete-account-password"
            label="Confirm password"
            type="password"
            autoComplete="current-password"
            value={password}
            error={passwordError}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError("");
              setSubmitError("");
            }}
          />

          {submitError && (
            <p role="alert" className={`text-sm ${notice.danger}`}>
              {submitError}
            </p>
          )}

          <div className="pt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className={buttonSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={buttonPrimary}>
              {submitting ? "Deleting..." : "Confirm delete"}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}

export default DeleteAccountDialog;
