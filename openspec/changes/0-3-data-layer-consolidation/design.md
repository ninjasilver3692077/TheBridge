# Design

## Context

See `proposal.md` (Why). After `0-1` and `0-2`:

- Seven services parse `localStorage` themselves: `listingsStorage`, `myBooksStorage` (three times), `librarySeed`, `favorites`, `requestsStorage`, and `openLibrary` (cache).
- Event names live in three modules (`LISTINGS_EVENT`, `REQUESTS_EVENT`, `MY_BOOKS_EVENT` in `librarySeed.js`), plus the literal `"thebridge:book-added"`.
- `myBooksStorage` imports from `librarySeed`, so moving the My Books event into `myBooksStorage` would create a circular import.

## Goals / Non-Goals

**Goals:**
- One place that knows how stored JSON is read, validated by shape, written, and announced.
- One shape per book across catalog results, listings, library books, and favorites.

**Non-Goals:**
- An abstraction over `localStorage` meant to be swapped for HTTP; Epics 2–4 replace each service's internals directly.

## Decisions

### `storage.js` API
- `readStorage(key, fallback)` parses the key and returns the value only when its shape matches `fallback` (array or plain object); otherwise it returns `fallback`.
- `writeStorage(key, value, eventName)` stringifies, writes, and dispatches `eventName` when given.
- `STORAGE_EVENTS = { listings, requests, myBooks }` holds the event names.
- `today()` returns `YYYY-MM-DD`.

Because the event names live in `storage.js`, `librarySeed` and `myBooksStorage` both import from it and the circular import never appears.
*Alternative:* one module per concern (`events.js`, `dates.js`). Rejected: three files for four small exports that are always used together.

### Book shape: `cover` and `year`
`normalizeOpenLibraryBooks` emits `cover` and `year`, matching listings and library books, so `toCatalogBook` is deleted and the two picker/seed mappers stop renaming fields. The only stored data in the old shape:
- **Favorites:** `readFavorites` maps `coverUrl` to `cover` for entries that lack `cover`, so old favorites keep their covers.
- **Open Library cache:** the key becomes `thebridge:openlibrary-cache-v2`; the old key is ignored. The cache is a disposable offline aid, so migrating it is not worth the code.

`cover` is the client view-model name only. The HTTP contract keeps `coverUrl` in `BookMetadata` and `RequestListingSummary` (`api-design.md`), and the backend stories' DTO adapters translate `coverUrl` to `cover`, as `architecture.md` already plans. This change does not alter the contract.

### Search rule
`validateCatalogQuery(query)` in `src/services/catalogSearch.js` returns `""` or one of the two messages; both `useMarketplace` and `useCatalogSearch` call it. Minimum 3 characters, the stricter of today's two rules, because 2-character queries return mostly noise from Open Library.

### Auth
`src/services/authStorage.js` exports `isAuthenticated()` and `logIn()`, wrapping the existing `thebridge:authenticated` key unchanged, so current sessions survive. The name matches the `authStorage` module that `architecture.md` assigns to the Session token, so the backend auth story extends this file instead of renaming it.

## Risks / Trade-offs

- [`readStorage` returns the fallback for a malformed `requests` value] → `requestsStorage` already falls back to its seed on anything that is not an array, so behavior is unchanged.
- [3-character minimum blocks valid 2-letter queries such as "AI"] → Accepted for consistency; revisit in the PRD if users report it.
- [Old Open Library cache entries are orphaned in `localStorage`] → They are capped at 10 entries and harmless; no cleanup code.
