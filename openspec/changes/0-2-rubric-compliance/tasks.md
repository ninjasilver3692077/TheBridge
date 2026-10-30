# Tasks

## 1. Data out of components

- [ ] 1.1 Add `library-01.webp`, `library-02.webp`, `library-03.webp` (provided by the team, reusable license) to `public/assets/hero/` and move the hero file list into `heroImages` in `src/data/homeContent.js`; verify every `home-hero` scenario, emulating reduced motion in DevTools and temporarily renaming one image for the fallback cases
- [ ] 1.2 Move quick searches to `src/data/marketplaceContent.js`, the My Books statuses to `myBookFilters` in `src/data/myBooks.js` (used by both `MyBooksFilters` and the `MyBooksPage` counters), the mobile-bar selection to `mobile: true` flags in `src/data/navigation.js`, and the MARC table plus formatter to `formatLanguage` in `src/services/languages.js`; verify no component defines those constants and that Marketplace quick searches, My Books filters, the mobile bar, and book language labels render as before
- [ ] 1.3 Reduce the active-route check in `SidebarNavigation` and `BottomNavigation` to `location.pathname === item.path`; verify the `app-navigation` scenarios still pass

## 2. Components under ~80 lines

- [ ] 2.1 Nest the four protected routes under one `<Route element={<ProtectedRoute />}>` that renders `<Outlet />`; verify that while logged out `/my-books`, `/add-book`, `/create-listing`, and `/requests` redirect to `/login`, and after logging in each page opens
- [ ] 2.2 Create `src/hooks/useStoredState.js` and use it in `RequestsPage`, `MyBooksPage`, and `useListingFilters`; verify that accepting a request updates the Requests list, adding a book appears in My Books, and publishing a listing appears in Marketplace, all without a page reload
- [ ] 2.3 Split `ListingFieldControls.jsx` into `FieldError.jsx`, `DurationSelect.jsx`, and `PriceInput.jsx`; extract `ExchangeBookOption.jsx` from `ExchangeBookOptions`; name the modality check once in `ListingRequestModal`; verify that Create Listing shows its price and duration validation errors and that an Exchange request can still be sent from a listing

## 3. Verify

- [ ] 3.1 Run `npm run lint` and `npm run build`; verify both exit with code 0 and `find src -name '*.jsx' -exec wc -l {} + | awk '$2 != "total" && $1 > 80'` prints nothing
- [ ] 3.2 Run `npm run dev` and visit every route at 375px and 1280px in light and dark mode; verify each screen looks as before (apart from the hero photographs) and the console shows no errors

## Workflow follow-up

- Apply only after `0-1-remove-dead-code` is merged.
- Task 1.1 waits for the images; the other tasks can be applied first.
- Open the story's pull request as a draft containing only this change's spec; the assigned reviewer approves the spec (Gate 1) before `/opsx:apply` starts.
- Push the code to the same pull request, run `/opsx:archive` once the tasks above are checked, and mark it ready; the reviewer runs `bmad-code-review` in a fresh session and approves (Gate 2) before the coordinator merges.
