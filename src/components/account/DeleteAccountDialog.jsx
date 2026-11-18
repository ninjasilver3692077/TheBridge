import { useDeleteAccountForm } from "../../hooks/useDeleteAccountForm.js";
import AuthField from "../auth/AuthField.jsx";
import AccountDialogActions from "./AccountDialogActions.jsx";
import AccountDialogFrame from "./AccountDialogFrame.jsx";

function DeleteAccountDialog({ onClose, onDeleted }) {
  const { password, passwordError, submitError, submitting, updatePassword, handleSubmit } =
    useDeleteAccountForm(onDeleted);

  return (
    <AccountDialogFrame
      titleId="delete-account-title"
      title="Delete account"
      description="Deleting your account permanently removes your library books, listings, and favorites, and rejects your pending requests. Enter your password to confirm."
      onClose={onClose}
    >
      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        <AuthField
          id="delete-account-password"
          label="Confirm password"
          type="password"
          autoComplete="current-password"
          value={password}
          error={passwordError}
          onChange={updatePassword}
        />

        <AccountDialogActions
          submitError={submitError}
          submitting={submitting}
          submitLabel="Confirm delete"
          submittingLabel="Deleting..."
          onClose={onClose}
        />
      </form>
    </AccountDialogFrame>
  );
}

export default DeleteAccountDialog;
