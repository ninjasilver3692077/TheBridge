# Tasks

## Superseded by the API migration (#31)

- Storage consolidation (`storage.js`, one My Books event): no longer needed; domain services call the API and do not read `localStorage`.
- Auth and favorites in services: done; `authStorage.js` exists and only the theme preference in `AppShell.jsx` touches `localStorage` outside `src/services/`.
- Migrating old favorites from `coverUrl`: favorites now live in the API.

## 1. Book shape and search rule

- [x] 1.1 Make `normalizeOpenLibraryBooks` emit `cover` and `year`; delete `toCatalogBook`, `coverUrl`, `publicationYear`, and the related fallbacks in client code; rename the cache key to `thebridge:openlibrary-cache-v2`; verify `grep -rnE 'coverUrl|publicationYear' src` matches only the API mapping layer and `src/types.ts`, and the offline cover scenario passes
- [x] 1.2 Add `validateCatalogQuery` to `src/services/catalogSearch.js` and use it in `useMarketplace` and `useCatalogSearch`; verify the `catalog-search` query scenarios in the Marketplace, Add Book, and desired-book searches

## 2. Verify

- [ ] 2.1 Run `npm run lint`, `npm run build`, and `npx knip`; verify all three report no errors or unused code. Status on 2026-11-18: lint and build pass. Added `knip.json` so `api/index.ts` (the Vercel entry point) and the tests count as entry points, and removed the unused client exports and `normalizeCatalogValue`/`fetchCurrentAccount` from `src/`. `npx knip` still reports 20 unused exports, 12 unused types and 5 duplicate exports in `models/`, `server/` and `src/types.ts`, which come from the API migration (#31) and are identical on `main`. Pending: resolve them or record an explicit exception from the coordinator in #52
- [x] 2.2 Run `npm run dev` and check Marketplace search (online, then offline in DevTools), Add Book, and the Create Listing desired-book search; verify the 3-character rule and covers behave as the spec says and the console shows no errors. Evidence on 2026-11-18 (Edwin, PR #62 review): automated local browser run with controlled data covering the three searches, query rejection without a request, covers online and from cache, the saved-data notice, 375/768/1280/1440 px and no JavaScript errors; this is not a production test
