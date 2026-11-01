import { formatLanguage } from "../../services/languages.js";

const FIELDS = {
  year: { label: "Year", read: (book) => book.publicationYear || book.year },
  publisher: { label: "Publisher", read: (book) => book.publisher },
  language: { label: "Language", read: (book) => formatLanguage(book.language) },
  isbn: { label: "ISBN", read: (book) => book.isbn },
  editions: {
    label: "Editions",
    read: (book) => (book.editionCount > 1 ? book.editionCount : null),
  },
};

function BookMetadata({
  book,
  fields = ["year", "publisher", "language", "isbn", "editions"],
  className = "",
}) {
  const rows = fields
    .map((field) => ({ field, ...FIELDS[field] }))
    .map((row) => ({ ...row, value: row.read(book) }))
    .filter((row) => row.value);

  if (rows.length === 0) {
    return null;
  }

  return (
    <dl className={`divide-y divide-line ${className}`}>
      {rows.map(({ field, label, value }) => (
        <div
          key={field}
          className="flex items-baseline justify-between gap-4 py-2 text-sm"
        >
          <dt className="text-ink-muted">{label}</dt>
          <dd className="min-w-0 truncate text-right font-medium text-ink">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default BookMetadata;
