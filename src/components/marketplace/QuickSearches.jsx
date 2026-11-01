import { quickSearches } from "../../data/marketplaceContent.js";
import { chipSm } from "../../styles/ui.js";

function QuickSearches({ onSearch }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs text-ink-muted">Try:</span>
      {quickSearches.map((query) => (
        <button
          key={query}
          type="button"
          onClick={() => onSearch(query)}
          className={chipSm}
        >
          {query}
        </button>
      ))}
    </div>
  );
}

export default QuickSearches;
