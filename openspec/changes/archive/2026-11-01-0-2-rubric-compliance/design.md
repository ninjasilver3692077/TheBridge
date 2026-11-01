# Design

## Context

See `proposal.md` (Why). Current state after `0-1-remove-dead-code`:

- `App.jsx` wraps each of the four protected pages in `<ProtectedRoute>` separately.
- `RequestsPage`, `MyBooksPage`, and `useListingFilters` each hold an effect that subscribes to custom events plus `storage` and reloads from a service.
- `ListingFieldControls.jsx` holds three components (`FieldError`, `DurationSelect`, `PriceInput`).
- Five constants that are content rather than presentation live inside components.

## Goals / Non-Goals

**Goals:**
- Every `.jsx` file in `src/` is 80 lines or fewer.
- No content or mock data is defined inside a component file; presentation maps (CSS tones, icon paths) may stay.

**Non-Goals:**
- Changing storage keys, event names, or service APIs; that is change `0-3`.
- Splitting files that are already under the limit.

## Decisions

### Protected routes: one layout route
`ProtectedRoute` renders `<Outlet />` when the flag is set, otherwise `<Navigate to="/login" replace />`. The four protected routes nest under `<Route element={<ProtectedRoute />}>`. This is the standard React Router v6 pattern and removes three wrapper blocks.
*Alternative:* keep the wrappers and move routes to a config array. Rejected: it hides the routing the rubric grades behind a map.

### Storage refresh: `useStoredState(load, eventNames)`
A hook in `src/hooks/useStoredState.js` returns the value of `load()`, re-reads it whenever one of `eventNames` or the browser `storage` event fires, and unsubscribes on unmount. `RequestsPage` drops its own `setRequests(loadRequests())` after a status update, because the service already dispatches the refresh event.
*Alternative:* move the subscription into each service as a `subscribe()` function. Rejected for now: change `0-3` reworks the services, and the hook keeps this change independent.

### Where moved data lives

| Constant | Destination |
|---|---|
| Hero file names | `heroImages` in new `src/data/homeContent.js` |
| Quick searches | `quickSearches` in new `src/data/marketplaceContent.js` |
| My Books filter statuses | `myBookFilters` in `src/data/myBooks.js`; `MyBooksPage` builds its counter seed from it |
| Mobile bar ids | `mobile: true` on the five items in `src/data/navigation.js` |
| MARC table and formatter | `formatLanguage` in new `src/services/languages.js` (logic, not data) |

### Splitting oversized components
- `ListingFieldControls.jsx` → `FieldError.jsx`, `DurationSelect.jsx`, and `PriceInput.jsx` in `components/create-listing/`; the original file is deleted.
- `ExchangeBookOptions` → extract `ExchangeBookOption.jsx` (one radio row).
- `ListingRequestModal` → `const isExchange = listing.modality === "Exchange"` replaces four repeated checks, which brings the file under the limit without a new file.

### Active route
After `0-1`, both navigations reduce to `location.pathname === item.path`; each uses that expression inline. A shared helper for one comparison would add a file without removing logic.

## Risks / Trade-offs

- [The layout route changes how protected pages mount] → Manually check each protected URL while logged out (expect `/login`) and logged in (expect the page).
- [`useStoredState` re-reads on every `storage` event, including unrelated keys] → Same behavior as today, and the services read small localStorage arrays.
- [Hero images depend on the team providing them] → Task 1.1 is the only blocked task; the rest can be applied first, and until then the existing fallback keeps the hero working.
