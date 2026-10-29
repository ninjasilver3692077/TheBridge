# Proposal

## Why

A critical review on 2026-10-25 (knip + grep, contrasted with the HW10 Milestone 2 rubric) found that about 300 lines of `src/` and 29 tracked files are dead: unused components and functions, a mock catalog that Open Library replaced, a data field nothing reads, a prop nothing receives, iCloud duplicate files, and the whole Milestone 1 vanilla prototype. This noise hides the real architecture from reviewers and the oral defense, and every later story (Express backend, data-layer consolidation) would have to step around it. It must go before new work starts.

BMAD story: **0.1 Remove dead code** (Epic 0, Milestone 2 hardening; provisional id until `epics.md` exists). Requirements: HW10 rubric "clean component architecture"; FR/NFR ids will be linked when `prd.md` is approved.

## What Changes

- Delete tracked iCloud conflict copies `src/hooks/useListingForm 2.js` and `src/components/my-books/MyBooksHeader 2.jsx` (byte-identical to their originals).
- Delete `src/components/SearchBar.jsx`, which nothing imports.
- Delete the Add Book mock catalog that Open Library replaced: `searchAddBookCatalog` and `isSimulatedSearchError` in `src/services/catalogSearch.js`, and `extraCatalogBooks` and `addBookCatalog` in `src/data/addBookData.js`. `normalizeCatalogValue` and `bookConditions` stay because they are used.
- Delete the `sellerPhotos` field from the 24 entries in `src/data/listings.js` and the three SVGs it points to in `public/assets/listings/`; no component reads either.
- Remove the `activePage` prop from `AppShell` and the 10 pages that pass it; `Sidebar` and `BottomNavigation` derive the active route from `useLocation` and never receive it.
- Delete the Milestone 1 prototype: `legacy/`, `js/`, `css/`, and the root `assets/` folder (a stale subset of `public/assets/`).
- Remove the "Listing Details" item (hard-wired to `/listing/book-01`) from the primary navigation, its special case in `SidebarNavigation`, and the `listing` icon case in `NavIcon` that only it used. **Visible change:** the sidebar loses one entry; listing details remain reachable from every listing.
- Drop the `export` keyword from symbols used only inside their own module: `loadAvailableMyBooks`, `loadUserListings`, `saveUserListing`, `createUserListing`, `applyRequestActivity`, `normalizeOpenLibraryBooks`. `FieldError` keeps its export because change `0-2-rubric-compliance` moves it into its own shared file.
- Strip the UTF-8 BOM from `src/data/navigation.js`, `src/data/createListingData.js`, `src/data/addBookData.js`, `src/services/favorites.js`, `src/services/catalogSearch.js`, `vite.config.js`, and `scripts/create-spa-fallback.js`.

### Out of scope

- Hero carousel images, components over ~80 lines, and data defined inside components (change `0-2-rubric-compliance`).
- Storage helper, `cover`/`coverUrl` field unification, event names, search validation, and moving auth and favorites into services (change `0-3-data-layer-consolidation`).
- Moving the app into `client/` (story 1.1) and documentation rewrites.

## Capabilities

### New Capabilities

- `app-navigation`: the primary navigation (sidebar and mobile bar): which destinations it lists and how it marks the current route.

### Modified Capabilities

None. No baseline specs exist yet; every other item in this change removes code without changing behavior.

## Impact

- **Code:** about 20 files edited under `src/`, plus `vite.config.js` and `scripts/create-spa-fallback.js` (BOM only).
- **Deleted:** 2 duplicate files, `SearchBar.jsx`, 3 SVGs in `public/assets/listings/`, and 24 files in `legacy/`, `js/`, `css/`, `assets/`.
- **Behavior:** unchanged except for the removed navigation entry.
- **APIs and dependencies:** none.
- **Risk:** low. Lint and build catch broken imports, and a manual pass over every route confirms nothing visible regressed.
