const SEARCH_FIELDS = [
  "key",
  "title",
  "author_name",
  "first_publish_year",
  "edition_count",
  "cover_i",
  "publisher",
  "isbn",
  "language",
].join(",");

function pickIsbn(isbns = []) {
  return isbns.find((isbn) => isbn.length === 13) || isbns[0] || null;
}

function pickLanguage(languages = []) {
  return languages.includes("eng") ? "eng" : languages[0] || null;
}

function normalizeOpenLibraryBooks(docs = []) {
  return docs.slice(0, 20).map((book) => {
    const year = book.first_publish_year || null;

    return {
      id: book.key || `${book.title}-${year || "unknown"}`,
      title: book.title || "Untitled",
      author: book.author_name?.[0] || "Unknown author",
      year,
      publicationYear: year,
      publisher: book.publisher?.[0] || null,
      isbn: pickIsbn(book.isbn),
      language: pickLanguage(book.language),
      editionCount: book.edition_count || 1,
      coverUrl: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : null,
    };
  });
}

const CACHE_KEY = "thebridge:openlibrary-cache";
const MAX_CACHED_QUERIES = 10;

function getCacheKey(query) {
  return query.trim().toLowerCase();
}

function readCache() {
  try {
    const stored = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    const entries = Object.entries(stored ?? {}).filter(
      ([, entry]) =>
        Array.isArray(entry?.books) && typeof entry?.savedAt === "string",
    );
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

function writeCache(query, books) {
  const entries = Object.entries({
    ...readCache(),
    [getCacheKey(query)]: { books, savedAt: new Date().toISOString() },
  })
    .sort(([, a], [, b]) => b.savedAt.localeCompare(a.savedAt))
    .slice(0, MAX_CACHED_QUERIES);

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
    return true;
  } catch {
    return false;
  }
}

async function searchOpenLibrary(query, signal) {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "20");
  url.searchParams.set("fields", SEARCH_FIELDS);

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Open Library returned ${response.status}.`);
  }

  const data = await response.json();
  return normalizeOpenLibraryBooks(data.docs);
}

export async function searchOpenLibraryWithCache(query, signal) {
  try {
    const books = await searchOpenLibrary(query, signal);
    writeCache(query, books);
    return { books, savedAt: null };
  } catch (requestError) {
    if (requestError.name === "AbortError") {
      throw requestError;
    }

    const cached = readCache()[getCacheKey(query)];

    if (cached) {
      return { books: cached.books, savedAt: cached.savedAt };
    }

    throw new Error(
      navigator.onLine
        ? "Open Library could not be reached and there is no saved data for this search yet."
        : "You are offline and there is no saved data for this search yet.",
      { cause: requestError },
    );
  }
}
