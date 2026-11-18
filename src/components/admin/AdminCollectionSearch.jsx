import { buttonPrimary, inputBase, selectField } from "../../styles/ui.js";

function AdminCollectionSearch({
  label,
  statuses,
  searchInput,
  status,
  onSearchInputChange,
  onStatusChange,
  onSubmit,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <input
        type="search"
        value={searchInput}
        onChange={(event) => onSearchInputChange(event.target.value)}
        placeholder={`Search ${label.toLowerCase()}`}
        aria-label={`Search ${label.toLowerCase()}`}
        maxLength={100}
        className={`${inputBase} h-11 sm:max-w-sm`}
      />

      {statuses && (
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          aria-label={`Filter ${label.toLowerCase()} by status`}
          className={`${selectField} sm:w-48`}
        >
          <option value="">All statuses</option>
          {statuses.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}

      <button type="submit" className={buttonPrimary}>
        Search
      </button>
    </form>
  );
}

export default AdminCollectionSearch;
