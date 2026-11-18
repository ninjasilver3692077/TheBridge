import { buttonSecondarySm } from "../../styles/ui.js";

function AdminCollectionPager({ label, meta, page, onPageChange }) {
  const totalPages = meta.totalPages ?? 1;

  return (
    <nav
      aria-label={`${label} pages`}
      className="mt-4 flex items-center justify-between gap-4 text-sm text-ink-muted"
    >
      <span>
        {meta.total} total · page {meta.page} of {totalPages}
      </span>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={buttonSecondarySm}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={buttonSecondarySm}
        >
          Next
        </button>
      </div>
    </nav>
  );
}

export default AdminCollectionPager;
