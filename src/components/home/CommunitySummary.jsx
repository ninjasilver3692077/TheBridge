import { useCallback } from "react";
import { useApiResource } from "../../hooks/useApiResource.js";
import { initialListingFilters } from "../../services/listingFilters.js";
import { fetchListingStats } from "../../services/listings.js";
import { sectionTitle } from "../../styles/ui.js";

const unavailable = "–";

function CommunitySummary() {
  const load = useCallback(
    (signal) => fetchListingStats(initialListingFilters, { signal }),
    [],
  );
  const { status, data: stats } = useApiResource(load);
  const ready = status === "success";
  const summaryItems = [
    { label: "Community listings", value: ready ? stats.total : unavailable },
    { label: "Sharing modes", value: ready ? Object.keys(stats.byModality).length : unavailable },
    { label: "Exchange options", value: ready ? stats.byModality.Exchange ?? 0 : unavailable },
    { label: "Books for sale", value: ready ? stats.byModality.Sale ?? 0 : unavailable },
  ];

  return (
    <section aria-labelledby="community-summary-title" className="mt-16 lg:mt-20">
      <h2 id="community-summary-title" className={sectionTitle}>
        The community at a glance
      </h2>

      <dl
        className="mt-6 grid grid-cols-2 gap-y-6 border-y border-line py-6 lg:grid-cols-4 lg:divide-x lg:divide-line"
        aria-busy={status === "loading"}
      >
        {summaryItems.map(({ label, value }) => (
          <div key={label} className="flex flex-col-reverse gap-1 pr-4 lg:px-6 lg:first:pl-0">
            <dt className="text-sm text-ink-muted">{label}</dt>
            <dd className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default CommunitySummary;
