import ListingRequestDialog from "./ListingRequestDialog.jsx";

function ListingRequestModal({ listing, open, onClose, onSent }) {
  if (!open) {
    return null;
  }

  return (
    <ListingRequestDialog listing={listing} onClose={onClose} onSent={onSent} />
  );
}

export default ListingRequestModal;
