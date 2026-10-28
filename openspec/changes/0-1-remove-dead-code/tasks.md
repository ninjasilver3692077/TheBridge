# Tasks

## 1. Remove dead code

- [x] 1.1 Delete `src/hooks/useListingForm 2.js`, `src/components/my-books/MyBooksHeader 2.jsx`, `src/components/SearchBar.jsx`, the three SVGs in `public/assets/listings/`, and the folders `legacy/`, `js/`, `css/`, `assets/`; verify `git ls-files | grep -E ' 2\.|^legacy/|^js/|^css/|^assets/|SearchBar|seller-copy'` prints nothing
- [x] 1.2 Remove `searchAddBookCatalog` and `isSimulatedSearchError` from `src/services/catalogSearch.js`, `extraCatalogBooks` and `addBookCatalog` (and the now-unused `listings` import) from `src/data/addBookData.js`, and the `sellerPhotos` field from every entry in `src/data/listings.js`; verify `grep -rnE 'sellerPhotos|addBookCatalog|extraCatalogBooks|searchAddBookCatalog|isSimulatedSearchError' src` prints nothing
- [x] 1.3 Remove the `activePage` prop from `src/components/AppShell.jsx` and from the 10 pages under `src/pages/`; verify `grep -rn activePage src` prints nothing
- [x] 1.4 Remove the "Listing Details" entry from `src/data/navigation.js`, its special case in `src/components/navigation/SidebarNavigation.jsx`, and the `listing` case in `src/components/navigation/NavIcon.jsx`; verify the sidebar shows the seven entries required by `specs/app-navigation/spec.md` and that no entry is marked on `/listing/book-03`
- [x] 1.5 Drop `export` from `loadAvailableMyBooks`, `loadUserListings`, `saveUserListing`, `createUserListing`, `applyRequestActivity`, `normalizeOpenLibraryBooks`, and strip the UTF-8 BOM from the seven files listed in `proposal.md`; verify `npx knip` reports no unused files and no unused exports other than `FieldError`, and `grep -rlI $'^\xEF\xBB\xBF' src vite.config.js scripts` prints nothing

## 2. Verify

- [x] 2.1 Run `npm run lint` and `npm run build`; verify both exit with code 0
- [x] 2.2 Run `npm run dev` and visit `/`, `/marketplace` (search Open Library), `/listing/book-03`, `/my-books`, `/add-book` (search and add a book), `/create-listing`, `/requests` (accept a request), `/about`, and an unknown URL; verify each page renders as before, the 404 page appears for the unknown URL, and the browser console shows no errors

## Workflow follow-up

- Open the story's pull request as a draft containing only this change's spec; the assigned reviewer approves the spec (Gate 1) before `/opsx:apply` starts.
- Push the code to the same pull request, run `/opsx:archive` once the tasks above are checked, and mark it ready; the reviewer runs `bmad-code-review` in a fresh session and approves (Gate 2) before the coordinator merges.
