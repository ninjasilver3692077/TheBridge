import AppShell from "../components/AppShell.jsx";
import CreateListingForm from "../components/create-listing/CreateListingForm.jsx";
import CreateListingHeader from "../components/create-listing/CreateListingHeader.jsx";
import CreateListingStatus from "../components/create-listing/CreateListingStatus.jsx";
import ListingBookCard from "../components/create-listing/ListingBookCard.jsx";
import ListingSuccess from "../components/create-listing/ListingSuccess.jsx";
import { useCreateListing } from "../hooks/useCreateListing.js";

function CreateListingPage() {
  const state = useCreateListing();
  const { book, published, handlePublish } = state;

  return (
    <AppShell title="Create Listing" subtitle="Choose how you want to share your book">
      <CreateListingHeader />
      <CreateListingStatus state={state} />
      {book && (
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-14">
          <ListingBookCard book={book} />

          {published ? (
            <ListingSuccess listing={published.listing} />
          ) : (
            <CreateListingForm onPublish={handlePublish} />
          )}
        </div>
      )}
    </AppShell>
  );
}

export default CreateListingPage;
