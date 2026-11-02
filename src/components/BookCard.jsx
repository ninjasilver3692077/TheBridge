import { cardInteractive } from "../styles/ui.js";
import BookCover from "./catalog/BookCover.tsx";
import BookDetailsDisclosure from "./catalog/BookDetailsDisclosure.jsx";
import FavoriteButton from "./catalog/FavoriteButton.tsx";

function BookCard({ book, isFavorite, onToggleFavorite }) {
  const summary = [book.publicationYear || book.year, book.publisher]
    .filter(Boolean)
    .join(" · ");
  const hasDetails =
    book.publisher || book.language || book.isbn || book.editionCount > 1;

  return (
    <article className={`group flex flex-col overflow-hidden ${cardInteractive}`}>
      <div className="relative aspect-[3/4] overflow-hidden">
        <BookCover
          src={book.coverUrl}
          title={book.title}
          className="h-full w-full transition duration-500 group-hover:scale-[1.02]"
        />

        <FavoriteButton
          title={book.title}
          isFavorite={isFavorite}
          onToggle={() => onToggleFavorite(book)}
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
          {book.title}
        </h2>

        <p className="mt-0.5 truncate text-sm text-ink-muted">
          {book.author || "Unknown author"}
        </p>

        <p className="mt-2 truncate text-xs text-ink-muted">
          {summary || "Publication details unavailable"}
        </p>

        {hasDetails && <BookDetailsDisclosure book={book} />}
      </div>
    </article>
  );
}

export default BookCard;
