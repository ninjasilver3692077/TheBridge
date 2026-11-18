# Tasks

## Superseded by the API migration (#31)

- Storage consolidation (`storage.js`, one My Books event): no longer needed; domain services call the API and do not read `localStorage`.
- Auth and favorites in services: done; `authStorage.js` exists and only the theme preference in `AppShell.jsx` touches `localStorage` outside `src/services/`.
- Migrating old favorites from `coverUrl`: favorites now live in the API.

## 1. Book shape and search rule

- [x] 1.1 Make `normalizeOpenLibraryBooks` emit `cover` and `year`; delete `toCatalogBook`, `coverUrl`, `publicationYear`, and the related fallbacks in client code; rename the cache key to `thebridge:openlibrary-cache-v2`; verify `grep -rnE 'coverUrl|publicationYear' src` matches only the API mapping layer and `src/types.ts`, and the offline cover scenario passes
- [x] 1.2 Add `validateCatalogQuery` to `src/services/catalogSearch.js` and use it in `useMarketplace` and `useCatalogSearch`; verify the `catalog-search` query scenarios in the Marketplace, Add Book, and desired-book searches

## 2. Verify

- [x] 2.1 Run `npm run lint`, `npm run build`, and `npx knip`; verify all three report no errors or unused code. Result on 2026-11-18: lint, build, typecheck and the 46 tests pass and `npx knip` exits 0. To get there: `knip.json` declares `api/index.ts` (the Vercel entry point), `server/scripts/*.ts` and `tests/**/*.ts` as entry points; unused client code was removed from `src/` (`normalizeCatalogValue`, `fetchCurrentAccount`) and six file-internal helpers are no longer exported; four helpers in `server/accounts.ts` used only inside that file are no longer exported. The remaining findings were the public contract surface and not dead code, so `knip.json` excludes them from the report: the exports, aliases and types of `models/**` and the types of `src/types.ts` (the shared types file required by HW14 and the model modules of HW12), identical on `main`. Nothing in `models/` or `src/types.ts` was changed
- [x] 2.2 Run `npm run dev` and check Marketplace search (online, then offline in DevTools), Add Book, and the Create Listing desired-book search; verify the 3-character rule and covers behave as the spec says and the console shows no errors. Evidence on 2026-11-18 (Edwin, PR #62 review): automated local browser run with controlled data covering the three searches, query rejection without a request, covers online and from cache, the saved-data notice, 375/768/1280/1440 px and no JavaScript errors; this is not a production test
