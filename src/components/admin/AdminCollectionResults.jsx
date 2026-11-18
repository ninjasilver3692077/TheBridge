import ErrorState from "../ErrorState.jsx";
import LoadingState from "../LoadingState.jsx";
import AdminCollectionPager from "./AdminCollectionPager.jsx";
import AdminCollectionTable from "./AdminCollectionTable.jsx";

function AdminCollectionResults({
  label,
  loadStatus,
  data,
  error,
  onRetry,
  emptyText,
  columns,
  renderRow,
  page,
  onPageChange,
}) {
  return (
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
          onRetry={onRetry}
        />
      )}

      {loadStatus === "success" && data.items.length === 0 && (
        <p className="rounded-2xl bg-surface-muted px-6 py-12 text-center text-sm text-ink-muted">
          {emptyText}
        </p>
      )}

      {loadStatus === "success" && data.items.length > 0 && (
        <AdminCollectionTable
          label={label}
          columns={columns}
          items={data.items}
          renderRow={renderRow}
        />
      )}

      {loadStatus === "success" && data.meta.total > 0 && (
        <AdminCollectionPager
          label={label}
          meta={data.meta}
          page={page}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

export default AdminCollectionResults;
