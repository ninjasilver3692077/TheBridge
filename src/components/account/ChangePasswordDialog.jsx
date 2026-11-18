import { useChangePasswordForm } from "../../hooks/useChangePasswordForm.js";
import AuthField from "../auth/AuthField.jsx";
import AccountDialogActions from "./AccountDialogActions.jsx";
import AccountDialogFrame from "./AccountDialogFrame.jsx";

function ChangePasswordDialog({ onClose, onSuccess }) {
  const { values, errors, submitError, submitting, updateField, handleSubmit } =
    useChangePasswordForm(onSuccess);

  return (
    <AccountDialogFrame
      titleId="change-password-title"
      title="Change password"
      description="Enter your current password and confirm your new password to update your account credentials."
      onClose={onClose}
    >
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

        <AccountDialogActions
          submitError={submitError}
          submitting={submitting}
          submitLabel="Update password"
          submittingLabel="Updating..."
          onClose={onClose}
        />
      </form>
    </AccountDialogFrame>
  );
}

export default ChangePasswordDialog;
