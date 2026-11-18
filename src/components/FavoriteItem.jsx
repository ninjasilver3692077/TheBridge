import { focusRing } from "../styles/ui.js";

function FavoriteItem({ book, onToggleFavorite }) {
  return (
    <li className="flex items-center gap-3 py-3">
      {book.cover ? (
        <img
          src={book.cover}
          alt=""
          className="h-14 w-10 shrink-0 rounded-md object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="h-14 w-10 shrink-0 rounded-md bg-surface-muted"
          aria-hidden="true"
        />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{book.title}</p>

        <p className="mt-0.5 truncate text-xs text-ink-muted">
          {book.author || "Unknown author"}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onToggleFavorite(book)}
        className={`shrink-0 rounded-lg px-2 py-1.5 text-xs font-semibold text-wine-ink transition-colors hover:bg-wine-soft ${focusRing}`}
        aria-label={`Remove ${book.title} from favorites`}
      >
        Remove
      </button>
    </li>
  );
}

export default FavoriteItem;
