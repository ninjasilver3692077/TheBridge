const ISBN_PATTERN = /^(?:\d{9}[\dX]|\d{13})$/;
const LANGUAGE_PATTERN = /^[a-zA-Z]{3}$/;

function cleanIsbn(isbn) {
  const compact = String(isbn ?? "").replace(/[\s-]/g, "").toUpperCase();
  return ISBN_PATTERN.test(compact) ? compact : null;
}

function cleanYear(year) {
  return Number.isInteger(year) && year >= 1 && year <= 9999 ? year : null;
}

export function toBookMetadata(book) {
  return {
    catalogId: book.id,
    title: book.title.slice(0, 300),
    author: book.author.slice(0, 200),
    ...(book.genre ? { genre: book.genre.slice(0, 80) } : {}),
    coverUrl: book.coverUrl || null,
    year: cleanYear(book.year),
    publisher: book.publisher ? book.publisher.slice(0, 200) : null,
    isbn: cleanIsbn(book.isbn),
    language: LANGUAGE_PATTERN.test(book.language ?? "") ? book.language : null,
  };
}
