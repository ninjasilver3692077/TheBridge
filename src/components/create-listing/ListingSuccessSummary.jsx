import {
  formatListingPrice,
  formatPaymentMethods,
} from "../../services/listingValidation.js";

function SummaryRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-ink sm:text-right">
        {value}
      </dd>
    </div>
  );
}

function ListingSuccessSummary({ listing }) {
  const { modality } = listing;

  return (
    <dl className="mt-6 divide-y divide-line border-y border-line">
      <SummaryRow
        label="Book"
        value={`${listing.title} — ${listing.author}`}
      />
      <SummaryRow label="Modality" value={modality} />

      {modality === "Exchange" && (
        <SummaryRow
          label="Desired book"
          value={
            listing.desiredBookMeta
              ? `${listing.desiredBook} — ${listing.desiredBookMeta.author}`
              : "Open to offers"
          }
        />
      )}

      {modality === "Loan" && (
        <SummaryRow label="Duration" value={listing.duration} />
      )}

      {modality === "Rental" && (
        <>
          <SummaryRow
            label="Price"
            value={formatListingPrice(listing.price)}
          />
          <SummaryRow label="Duration" value={listing.duration} />
        </>
      )}

      {modality === "Sale" && (
        <>
          <SummaryRow label="Price" value={formatListingPrice(listing.price)} />
          <SummaryRow
            label="Payment methods"
            value={formatPaymentMethods(listing.paymentMethods)}
          />
        </>
      )}
    </dl>
  );
}

export default ListingSuccessSummary;
