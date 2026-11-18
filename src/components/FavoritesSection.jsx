import { focusRing } from "../styles/ui.js";
import FavoriteItem from "./FavoriteItem.jsx";

function FavoritesSection({
  favorites,
  notice,
  status,
  error,
  onRetry,
  onToggleFavorite,
}) {
  return (
    <section
      className="rounded-2xl border border-line bg-surface p-5"
      aria-labelledby="favorites-title"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="favorites-title" className="text-base font-semibold text-ink">
          Favorites
        </h2>

        <span className="rounded-full bg-wine-soft px-2.5 py-0.5 text-xs font-semibold text-wine-ink">
          {status === "success" ? favorites.length : "–"}
        </span>
      </div>

      {notice && (
        <p role="alert" className="mt-3 text-sm leading-6 text-wine-ink">
          {notice}
        </p>
      )}

      {status === "error" ? (
        <div role="alert" className="mt-3 text-sm leading-6 text-wine-ink">
          <p>{error || "We could not load your favorites."}</p>
          <button
            type="button"
            onClick={onRetry}
            className={`mt-2 rounded-lg px-2 py-1.5 text-xs font-semibold underline ${focusRing}`}
          >
            Try again
          </button>
        </div>
      ) : status === "loading" ? (
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          Loading favorites...
        </p>
      ) : favorites.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          Books you save will appear here.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {favorites.map((book) => (
            <FavoriteItem
              key={book.id}
              book={book}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export default FavoritesSection;
