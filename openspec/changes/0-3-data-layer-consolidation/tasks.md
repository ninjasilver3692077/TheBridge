# Tasks

## 1. Storage and services

- [ ] 1.1 Create `src/services/storage.js` (`readStorage`, `writeStorage`, `STORAGE_EVENTS`, `today`) and route every service's localStorage reads, writes, event dispatches, and date stamps through it; verify `grep -rn 'JSON.parse(localStorage\|toISOString().split' src` matches only `storage.js`
- [ ] 1.2 Merge `thebridge:book-added` into `STORAGE_EVENTS.myBooks` and update `MyBooksPage`; verify `grep -rn 'book-added' src` prints nothing and a book added in Add Book appears in My Books without reloading
- [ ] 1.3 Create `src/services/authStorage.js` (`isAuthenticated`, `logIn`) and add the write side to `src/services/favorites.js`; switch `App.jsx`, `LoginPage`, and `useMarketplace` to them and remove the direct-access pitfall line from `AGENTS.md`; verify `grep -rn localStorage src | grep -v '^src/services/'` matches only the theme line in `AppShell.jsx`, and that login, the protected-route redirect, and toggling favorites still work

## 2. Book shape and search rule

- [ ] 2.1 Make `normalizeOpenLibraryBooks` emit `cover` and `year`; delete `toCatalogBook`, `coverUrl`, `publicationYear`, and the related fallbacks; migrate `coverUrl` in `readFavorites`; rename the cache key to `thebridge:openlibrary-cache-v2`; verify `grep -rnE 'coverUrl|publicationYear' src` matches only the favorites migration, and the `catalog-search` cover scenarios pass (seed an old-shape favorite in DevTools first)
- [ ] 2.2 Add `validateCatalogQuery` to `src/services/catalogSearch.js` and use it in `useMarketplace` and `useCatalogSearch`; verify the `catalog-search` query scenarios in the Marketplace, Add Book, and desired-book searches

## 3. Verify

- [ ] 3.1 Run `npm run lint`, `npm run build`, and `npx knip`; verify all three report no errors or unused code
- [ ] 3.2 Run `npm run dev` and walk through login, Marketplace search (online, then offline in DevTools), favorites, Add Book, Create Listing with a desired book, sending an exchange request, and accepting it in Requests; verify each flow behaves as before and the console shows no errors

## Workflow follow-up

- Apply only after `0-2-rubric-compliance` is merged.
- Open the story's pull request as a draft containing only this change's spec; the assigned reviewer approves the spec (Gate 1) before `/opsx:apply` starts.
- Push the code to the same pull request, run `/opsx:archive` once the tasks above are checked, and mark it ready; the reviewer runs `bmad-code-review` in a fresh session and approves (Gate 2) before the coordinator merges.
