import { badge, coverFrame, modalityTone } from "../../styles/ui.js";

function QuickViewSummary({ listing }) {
  return (
    <div className="flex gap-5">
      <div
        className={`aspect-[3/4] w-28 shrink-0 shadow-card sm:w-32 ${coverFrame}`}
      >
        {listing.cover ? (
          <img
            src={listing.cover}
            alt={`Cover of ${listing.title}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-surface-muted p-3 text-center text-xs font-semibold text-ink-muted">
            {listing.title}
          </div>
        )}
      </div>

      <div className="min-w-0 pt-1">
        <h2
          id="quick-view-title"
          className="text-2xl font-bold leading-tight tracking-tight text-ink"
        >
          {listing.title}
        </h2>

        <p className="mt-1 text-[15px] text-ink-muted">
          {listing.author}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={`${badge} ${modalityTone[listing.modality] ?? ""}`}
          >
            {listing.modality}
          </span>
          <span className={`${badge} bg-surface-muted text-ink-muted`}>
            {listing.condition}
          </span>
        </div>
      </div>
    </div>
  );
}

export default QuickViewSummary;
