import { badge, coverFrame, tone } from "../../styles/ui.js";
import MyBookStatusAction from "./MyBookStatusAction.jsx";

const STATUS_TONE = {
  Available: tone.sage,
  Published: tone.plum,
  Loaned: tone.amber,
  Borrowed: tone.amber,
};

function MyBookCard({ book }) {
  return (
    <article className="flex flex-col">
      <div className={`relative aspect-[2/3] shadow-card ${coverFrame}`}>
        {book.cover ? (
          <img
            src={book.cover}
            alt={`Cover of ${book.title}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm font-medium text-ink-muted">
            Cover unavailable
          </div>
        )}

        <span
          className={`absolute left-3 top-3 shadow-sm ${badge} ${STATUS_TONE[book.status] ?? "bg-surface text-ink"}`}
        >
          {book.status}
        </span>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <h2 className="truncate text-[15px] font-semibold text-ink">
          {book.title}
        </h2>

        <p className="mt-0.5 truncate text-sm text-ink-muted">{book.author}</p>

        <p className="mt-2 truncate text-xs text-ink-muted">
          {[book.genre, book.condition].filter(Boolean).join(" · ")}
        </p>

        <div className="mt-4">
          <MyBookStatusAction book={book} />
        </div>
      </div>
    </article>
  );
}

export default MyBookCard;
