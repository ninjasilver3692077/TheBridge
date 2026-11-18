import { useCallback } from "react";
import { useParams } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { useApiResource } from "../hooks/useApiResource.js";
import { fetchListing } from "../services/listings.js";
import ListingDetailsPage from "./ListingDetailsPage.jsx";

function ListingRoute() {
  const { id } = useParams();
  const load = useCallback((signal) => fetchListing(id, { signal }), [id]);
  const { status, data: listing, error, reload } = useApiResource(load);

  if (status === "success") {
    return <ListingDetailsPage key={id} listing={listing} />;
  }

  return (
    <AppShell title="Listing details" subtitle="Loading this listing">
      {status === "error" ? (
        <ErrorState
          title="We could not load this listing"
          message={error}
          onRetry={reload}
        />
      ) : (
        <LoadingState
          title="Loading listing..."
          message="Fetching the details of this book."
        />
      )}
    </AppShell>
  );
}

export default ListingRoute;
