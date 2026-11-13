import { useState } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "../../hooks/useDialogFocus.js";
import {
  changePassword,
  fieldFromServerMessage,
  validateChangePasswordFields,
} from "../../services/auth.js";
import { buttonPrimary, buttonSecondary, notice } from "../../styles/ui.js";
import AuthField from "../auth/AuthField.jsx";

function ChangePasswordDialog({ onClose, onSuccess }) {
  const [values, setValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { dialogRef, handleKeyDown } = useDialogFocus(true, onClose);

  const updateField = (field) => (event) => {
    const nextValue = event.target.value;
    setValues((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateChangePasswordFields(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      onSuccess("Your password was updated.");
    } catch (requestError) {
      const message = requestError?.message || "We could not update your password.";
      const mapped = fieldFromServerMessage(message);
      if (mapped) {
        setErrors((current) => ({ ...current, [mapped.field]: mapped.message }));
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
        aria-labelledby="change-password-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="w-full max-w-lg rounded-2xl border border-line bg-surface-raised p-6 shadow-2xl focus:outline-none sm:p-7"
      >
        <h2
          id="change-password-title"
          className="text-2xl font-bold tracking-tight text-ink"
        >
          Change password
        </h2>

        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Enter your current password and confirm your new password to update your
          account credentials.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <AuthField
            id="current-password"
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={values.currentPassword}
            error={errors.currentPassword}
            onChange={updateField("currentPassword")}
          />

          <AuthField
            id="new-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters."
            value={values.newPassword}
            error={errors.newPassword}
            onChange={updateField("newPassword")}
          />

          <AuthField
            id="confirm-new-password"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            error={errors.confirmPassword}
            onChange={updateField("confirmPassword")}
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
              {submitting ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}

export default ChangePasswordDialog;
