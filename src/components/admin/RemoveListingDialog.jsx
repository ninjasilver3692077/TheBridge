import { useDialogFocus } from "../../hooks/useDialogFocus.js";
import RemoveListingForm from "./RemoveListingForm.jsx";

function RemoveListingDialog({ listing, onClose, onRemoved }) {
  const { dialogRef, handleKeyDown } = useDialogFocus(true, onClose);

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

        <RemoveListingForm
          listing={listing}
          onClose={onClose}
          onRemoved={onRemoved}
        />
      </section>
    </div>
  );
}

export default RemoveListingDialog;
