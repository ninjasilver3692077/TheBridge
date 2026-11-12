import { eyebrow, focusRing } from "../../styles/ui.js";

function RequestDialogHeader({ listing, onClose }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={eyebrow}>
          New request
        </p>

        <h2
          id="request-dialog-title"
          className="mt-2 text-2xl font-bold tracking-tight text-ink"
        >
          Request {listing.modality}
        </h2>

        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Review the listing before sending your request to {listing.owner}.
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close request dialog"
        className={`-mr-2 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xl text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink ${focusRing}`}
      >
        ×
      </button>
    </div>
  );
}

export default RequestDialogHeader;
