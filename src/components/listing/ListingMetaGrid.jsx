function ListingMetaItem({ label, value, wide = false }) {
  if (!value) {
    return null;
  }

  return (
    <div
      className={`border-t border-line py-3.5 ${wide ? "sm:col-span-2" : ""}`}
    >
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
        {label}
      </dt>

      <dd className="mt-1 text-[15px] font-medium text-ink">{value}</dd>
    </div>
  );
}

function ListingMetaGrid({ listing, priceLabel }) {
  return (
    <dl className="mt-8 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
      <ListingMetaItem label="Owner" value={listing.owner} />
      <ListingMetaItem label="Community" value={listing.university} />
      <ListingMetaItem label="Year" value={listing.year} />
      <ListingMetaItem label="Status" value={listing.status} />
      <ListingMetaItem label="Price" value={priceLabel} />
      <ListingMetaItem label="Duration" value={listing.duration} />
      <ListingMetaItem
        label="Payment methods"
        value={listing.paymentMethods?.join(", ")}
      />
      <ListingMetaItem
        label="Looking for"
        value={listing.desiredBook}
        wide
      />
    </dl>
  );
}

export default ListingMetaGrid;
