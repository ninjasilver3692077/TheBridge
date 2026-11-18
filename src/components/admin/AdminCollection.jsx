import { useCallback, useState } from "react";
import { useApiResource } from "../../hooks/useApiResource.js";
import AdminCollectionResults from "./AdminCollectionResults.jsx";
import AdminCollectionSearch from "./AdminCollectionSearch.jsx";

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

  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <section aria-label={label} className="mt-6">
      <AdminCollectionSearch
        label={label}
        statuses={statuses}
        searchInput={searchInput}
        status={status}
        onSearchInputChange={setSearchInput}
        onStatusChange={handleStatusChange}
        onSubmit={handleSearch}
      />

      <AdminCollectionResults
        label={label}
        loadStatus={loadStatus}
        data={data}
        error={error}
        onRetry={reload}
        emptyText={emptyText}
        columns={columns}
        renderRow={renderRow}
        page={page}
        onPageChange={setPage}
      />
    </section>
  );
}

export default AdminCollection;
