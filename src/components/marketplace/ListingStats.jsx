import { listingModalities } from "../../data/createListingData.js";
import { formatListingPrice } from "../../services/listingValidation.js";

function formatAverage(average) {
  return average === null ? "No priced listings" : formatListingPrice(average);
}

function StatItem({ label, children, emphasis = false }) {
  return (
    <div className="flex min-w-0 flex-col-reverse gap-1">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd
        className={
          emphasis
            ? "text-2xl font-bold tracking-tight text-wine-ink"
            : "text-2xl font-bold tracking-tight text-ink"
        }
      >
        {children}
      </dd>
    </div>
  );
}

function ListingStats({ stats }) {
  return (
    <section
      aria-labelledby="listing-stats-title"
      className="rounded-2xl bg-surface-muted p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="listing-stats-title" className="text-base font-semibold text-ink">
          Listing stats
        </h2>
        <p className="text-xs text-ink-muted">
          Calculated from the listings that match your current search and
          filters.
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-5">
        <StatItem label="Listings shown" emphasis>
          {stats.total}
        </StatItem>

        {listingModalities.map(({ id, label }) => (
          <StatItem key={id} label={label}>
            {stats.byModality[id] ?? 0}
          </StatItem>
        ))}
      </dl>

      <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-line pt-4 sm:grid-cols-2">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm text-ink-muted">Average sale price</dt>
          <dd className="text-right text-sm font-semibold text-ink">
            {formatAverage(stats.averageSalePriceCop)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm text-ink-muted">Average rental price</dt>
          <dd className="text-right text-sm font-semibold text-ink">
            {formatAverage(stats.averageRentalPriceCop)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export default ListingStats;
