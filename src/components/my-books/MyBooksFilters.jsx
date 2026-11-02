import { myBookFilters } from "../../data/myBooks.js";
import { chip } from "../../styles/ui.js";

function MyBooksFilters({ activeFilter, counts, onChange }) {
  return (
    <div
      className="mt-8 flex flex-wrap gap-2"
      role="group"
      aria-label="Filter personal books"
    >
      {myBookFilters.map((filter) => {
        const isActive = activeFilter === filter;

        return (
          <button
            key={filter}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(filter)}
            className={chip}
          >
            {filter}{" "}
            <span className="text-xs opacity-70">{counts[filter]}</span>
          </button>
        );
      })}
    </div>
  );
}

export default MyBooksFilters;
