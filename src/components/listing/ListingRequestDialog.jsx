import { useDialogFocus } from "../../hooks/useDialogFocus.js";
import { useListingRequest } from "../../hooks/useListingRequest.js";
import ListingRequestForm from "./ListingRequestForm.jsx";
import RequestDialogHeader from "./RequestDialogHeader.jsx";
import RequestOfferRows from "./RequestOfferRows.jsx";

function ListingRequestDialog({ listing, onClose, onSent }) {
  const request = useListingRequest(listing, onClose, onSent);
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
        aria-labelledby="request-dialog-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface-raised p-6 shadow-2xl focus:outline-none sm:p-7"
      >
        <RequestDialogHeader listing={listing} onClose={onClose} />

        <RequestOfferRows listing={listing} />

        <ListingRequestForm request={request} onClose={onClose} />
      </section>
    </div>
  );
}

export default ListingRequestDialog;
