# Tasks

## Superseded by the API migration (#31)

- Storage consolidation (`storage.js`, one My Books event): no longer needed; domain services call the API and do not read `localStorage`.
- Auth and favorites in services: done; `authStorage.js` exists and only the theme preference in `AppShell.jsx` touches `localStorage` outside `src/services/`.
- Migrating old favorites from `coverUrl`: favorites now live in the API.

## 1. Book shape and search rule

- [x] 1.1 Make `normalizeOpenLibraryBooks` emit `cover` and `year`; delete `toCatalogBook`, `coverUrl`, `publicationYear`, and the related fallbacks in client code; rename the cache key to `thebridge:openlibrary-cache-v2`; verify `grep -rnE 'coverUrl|publicationYear' src` matches only the API mapping layer and `src/types.ts`, and the offline cover scenario passes
- [x] 1.2 Add `validateCatalogQuery` to `src/services/catalogSearch.js` and use it in `useMarketplace` and `useCatalogSearch`; verify the `catalog-search` query scenarios in the Marketplace, Add Book, and desired-book searches

## 2. Verify

- [ ] 2.1 Run `npm run lint`, `npm run build`, and `npx knip`; verify all three report no errors or unused code
- [ ] 2.2 Run `npm run dev` and check Marketplace search (online, then offline in DevTools), Add Book, and the Create Listing desired-book search; verify the 3-character rule and covers behave as the spec says and the console shows no errors
