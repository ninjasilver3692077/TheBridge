import { buttonPrimary, buttonSecondary, notice } from "../../styles/ui.js";

function RequestDialogActions({ sendDisabled, submitting, submitError, onCancel }) {
  return (
    <>
      <p className={`mt-6 text-xs ${notice.info}`}>
        The owner will see your request and can accept or reject it. TheBridge
        does not process payments or send messages; you coordinate the handover
        in person.
      </p>

      {submitError && (
        <p role="alert" className={`mt-4 text-sm ${notice.danger}`}>
          {submitError}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className={buttonSecondary}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={sendDisabled}
          className={buttonPrimary}
        >
          {submitting ? "Sending..." : "Send request"}
        </button>
      </div>
    </>
  );
}

export default RequestDialogActions;
