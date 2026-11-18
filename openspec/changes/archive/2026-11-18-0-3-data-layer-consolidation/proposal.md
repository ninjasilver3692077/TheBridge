# Proposal

## Why

The client data layer is the seam the Express backend will replace, but the 2026-10-25 review found it inconsistent:

- the same "read JSON from localStorage with a fallback" block is copied 8 times;
- the same book field has two names (`cover`/`coverUrl`, `year`/`publicationYear`), which forces three translator functions and `a || b` fallbacks;
- My Books uses three event names;
- auth and favorites bypass services and touch `localStorage` from components;
- the two book-search flows enforce different minimum lengths against the same API.

Consolidating now keeps the backend stories (Epics 2–4) small: each one swaps one service, not scattered storage calls.

BMAD story: **0.3 Data-layer consolidation** (Epic 0, Milestone 2 hardening; provisional id until `epics.md` exists). Requirements: NFR-16 (domain data only through `src/services/*`); FR-5 (3-character minimum, extended to the Add Book search of FR-8 and the desired-book picker of FR-10); FR-2 and FR-6 (login and Favorites move into services, behavior unchanged). Depends on `0-2-rubric-compliance`.

## What Changes

- **One storage module:** `src/services/storage.js` owns reading and writing JSON in `localStorage`, the refresh event names, and the date stamp used on stored records. The 8 copied read blocks, the 4 copied date expressions, and the scattered `dispatchEvent` calls route through it.
- **One My Books event:** `thebridge:book-added` merges into the single My Books refresh event.
- **Auth and favorites in services:** a new `src/services/authStorage.js` owns the login flag; `src/services/favorites.js` gains the write side. `App.jsx`, `LoginPage`, and `useMarketplace` stop touching `localStorage`.
- **One name per book field:** Open Library results use `cover` and `year`, like listings and library books. `coverUrl`, `publicationYear`, `toCatalogBook`, and the cover renaming in `toDesiredBookMeta` and `toSeedBook` disappear. Favorites saved under the old name are migrated when read, and the Open Library cache moves to a new key. The API contract keeps `coverUrl`; backend adapters translate it.
- **One search rule:** every book search requires at least 3 characters and shows the same messages. **Behavior change:** Add Book and the Create Listing desired-book search used to accept 2 characters.
- **Docs first:** remove the `AGENTS.md` pitfall about direct `localStorage` access once no such access remains.

### Out of scope

- Replacing `localStorage` with HTTP calls (Epics 2–4).
- Changing storage keys other than the Open Library cache, or the shape of stored listings, requests, or library books.

## Capabilities

### New Capabilities

- `catalog-search`: the rules shared by every book search against the external catalog (Marketplace catalog, Add Book, and the desired-book picker).

### Modified Capabilities

None. No baseline specs exist; the other items change internals only.

## Impact

- **Code:** about 8 services, 3 hooks, 2 pages, and 5 components under `src/`, plus 2 new service files.
- **Stored data:** the Open Library cache restarts empty under its new key; favorites keep their covers through the read migration; other keys are untouched.
- **Behavior:** 2-character searches in Add Book and Create Listing now show the minimum-length message.
- **Dependencies:** none.
- **Risk:** medium. Each touched flow gets a manual check, including offline mode for the cache.
