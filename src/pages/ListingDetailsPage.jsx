import { useState } from "react";
import AppShell from "../components/AppShell.jsx";
import ListingCoverCard from "../components/listing/ListingCoverCard.jsx";
import ListingMetaGrid from "../components/listing/ListingMetaGrid.jsx";
import ListingOverview from "../components/listing/ListingOverview.jsx";
import ListingRequestCta from "../components/listing/ListingRequestCta.jsx";
import ListingRequestModal from "../components/listing/ListingRequestModal.jsx";
import ListingUnavailable from "../components/listing/ListingUnavailable.jsx";
import { hasActiveSentRequest } from "../services/requestsStorage.js";

function formatPrice(price) {
  if (price === null || price === undefined) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price);
}

function ListingDetailsPage({ listing }) {
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(
    () => Boolean(listing) && hasActiveSentRequest(listing.id),
  );

  if (!listing) {
    return (
      <AppShell
        title="Listing details"
        subtitle="This listing could not be found"
      >
        <ListingUnavailable />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Listing details"
      subtitle={`${listing.title} by ${listing.author}`}
    >
      <article className="grid grid-cols-1 gap-10 pt-2 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-16 lg:pt-6">
        <ListingCoverCard listing={listing} />

        <section className="min-w-0">
          <ListingOverview listing={listing} />

          <ListingMetaGrid
            listing={listing}
            priceLabel={formatPrice(listing.price)}
          />

          <ListingRequestCta
            modality={listing.modality}
            requestSent={requestSent}
            onRequest={() => setRequestOpen(true)}
          />
        </section>
      </article>

      <ListingRequestModal
        listing={listing}
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        onSent={() => setRequestSent(true)}
      />
    </AppShell>
  );
}

export default ListingDetailsPage;
