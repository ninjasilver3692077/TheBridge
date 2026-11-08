import { buttonGhost, buttonSecondarySm, fieldLabel } from "../../styles/ui.js";
import BookCover from "../catalog/BookCover.tsx";

function SelectedDesiredBook({
  selected,
  changeButtonRef,
  onChangeBook,
  onRemove,
}) {
  return (
    <div>
      <p className={fieldLabel}>
        Desired book{" "}
        <span className="font-normal text-ink-muted">(optional)</span>
      </p>

      <div className="flex gap-4 rounded-2xl border border-wine/30 bg-wine-soft p-4">
        <BookCover
          src={selected.coverUrl}
          title={selected.title}
          className="h-24 w-16 shrink-0 rounded-md shadow-card"
        />

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-wine-ink">
            Selected from the catalog
          </p>
          <p className="mt-1 font-semibold text-ink">{selected.title}</p>
          <p className="text-sm text-ink-muted">{selected.author}</p>
          {(selected.year || selected.publisher) && (
            <p className="mt-0.5 truncate text-xs text-ink-muted">
              {[selected.year, selected.publisher]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              ref={changeButtonRef}
              type="button"
              onClick={onChangeBook}
              className={buttonSecondarySm}
            >
              Change book
            </button>
            <button
              type="button"
              onClick={onRemove}
              className={buttonGhost}
            >
              Remove selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectedDesiredBook;
