import { buttonPrimary, buttonSecondary, notice } from "../../styles/ui.js";

function AccountDialogActions({ submitError, submitting, submitLabel, submittingLabel, onClose }) {
  return (
    <>
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
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </>
  );
}

export default AccountDialogActions;
