import { useCallback, useState } from "react";
import { useApiResource } from "../../hooks/useApiResource.js";
import {
  buttonPrimary,
  buttonSecondarySm,
  card,
  inputBase,
  selectField,
} from "../../styles/ui.js";
import ErrorState from "../ErrorState.jsx";
import LoadingState from "../LoadingState.jsx";

function AdminCollection({
  label,
  fetchPage,
  statuses,
  columns,
  emptyText,
  reloadKey,
  renderRow,
}) {
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(
    (signal) => fetchPage({ page, q: query, status, signal, reloadKey }),
    [fetchPage, page, query, status, reloadKey],
  );
  const { status: loadStatus, data, error, reload } = useApiResource(load);

  const handleSearch = (event) => {
    event.preventDefault();
    setQuery(searchInput.trim());
    setPage(1);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <section aria-label={label} className="mt-6">
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={`Search ${label.toLowerCase()}`}
          aria-label={`Search ${label.toLowerCase()}`}
          maxLength={100}
          className={`${inputBase} h-11 sm:max-w-sm`}
        />

        {statuses && (
          <select
            value={status}
            onChange={handleStatusChange}
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

      <div className="mt-6">
        {loadStatus === "loading" && (
          <LoadingState
            title={`Loading ${label.toLowerCase()}...`}
            message="Fetching the latest records."
          />
        )}

        {loadStatus === "error" && (
          <ErrorState
            title={`We could not load ${label.toLowerCase()}`}
            message={error}
            onRetry={reload}
          />
        )}

        {loadStatus === "success" && data.items.length === 0 && (
          <p className="rounded-2xl bg-surface-muted px-6 py-12 text-center text-sm text-ink-muted">
            {emptyText}
          </p>
        )}

        {loadStatus === "success" && data.items.length > 0 && (
          <div className={`overflow-x-auto ${card}`}>
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">{label}</caption>
              <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  {columns.map((column) => (
                    <th key={column} scope="col" className="px-4 py-3 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.items.map(renderRow)}
              </tbody>
            </table>
          </div>
        )}

        {loadStatus === "success" && data.meta.total > 0 && (
          <nav
            aria-label={`${label} pages`}
            className="mt-4 flex items-center justify-between gap-4 text-sm text-ink-muted"
          >
            <span>
              {data.meta.total} total · page {data.meta.page} of {totalPages}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className={buttonSecondarySm}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className={buttonSecondarySm}
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </div>
    </section>
  );
}

export default AdminCollection;
