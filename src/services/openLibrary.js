import { apiRequest } from "./apiClient.js";

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
      publisher: book.publisher?.[0] || null,
      isbn: pickIsbn(book.isbn),
      language: pickLanguage(book.language),
      editionCount: book.edition_count || 1,
      cover: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : "",
    };
  });
}

const CACHE_KEY = "thebridge:openlibrary-cache-v2";
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
  const params = new URLSearchParams({ q: query.trim() });
  const { data } = await apiRequest(`/catalog/search?${params}`, { signal });
  return normalizeOpenLibraryBooks(data.docs);
}

export async function searchOpenLibraryWithCache(query, signal) {
  signal?.throwIfAborted();

  try {
    if (!navigator.onLine) throw new Error("The device is offline.");

    const books = await searchOpenLibrary(query, signal);
    signal?.throwIfAborted();
    writeCache(query, books);
    return { books, savedAt: null };
  } catch (requestError) {
    signal?.throwIfAborted();
    if (requestError.name === "AbortError") {
      throw requestError;
    }

    const cache = readCache();
    const key = getCacheKey(query);

    if (Object.hasOwn(cache, key)) {
      const { books, savedAt } = cache[key];
      return { books, savedAt };
    }

    throw new Error(
      navigator.onLine
        ? "Open Library could not be reached and there is no saved data for this search yet."
        : "You are offline and there is no saved data for this search yet.",
      { cause: requestError },
    );
  }
}
