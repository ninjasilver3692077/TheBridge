# Proposal

## Why

The HW10 Milestone 2 rubric, which Claude grades and the team defends orally, requires "no mock data inside components" and "no component should exceed ~80 lines". The 2026-10-25 review found five data constants inside components, five files over 80 lines, and a Home hero carousel that requests three images that were never added. In production every Home visit fires three failing requests, and the carousel never shows anything but its fallback. These gaps are visible to the grader and must close before the defense.

BMAD story: **0.2 Rubric compliance** (Epic 0, Milestone 2 hardening; provisional id until `epics.md` exists). Requirements: HW10 rubric, Architecture section. No `prd.md` requirement changes; the refactors must preserve FR-3 (protected areas), FR-5 (quick searches), FR-7 (My Books filters), FR-10 (listing form), FR-15 (language in Listing details), FR-17 and FR-18 (Requests), and FR-25 (navigation). The Home hero is decorative and outside FR-16. Depends on `0-1-remove-dead-code`, which removes code this change would otherwise have to touch.

## What Changes

- **Hero carousel works:** the team adds `library-01.webp`, `library-02.webp`, and `library-03.webp` to `public/assets/hero/`, and the list of hero files moves from the component to `src/data/`.
- **Data out of components:**
  - quick searches move from `QuickSearches` into a marketplace data file;
  - the My Books filter statuses move into `src/data/myBooks.js` and become the single source for both the filter chips and the page counters;
  - the mobile-bar selection becomes a flag on each item in `src/data/navigation.js`;
  - the MARC-to-ISO language table and its formatter move from `BookMetadata` into a service.
- **Files under ~80 lines:**
  - `App.jsx` (86): protected routes nest under one layout route instead of wrapping each page;
  - `RequestsPage` (90): the "reload on storage events" effect, repeated in three places, becomes one shared hook;
  - `ListingFieldControls` (91): each field control moves to its own file;
  - `ExchangeBookOptions` (83): the option row becomes its own component;
  - `ListingRequestModal` (83): repeated modality checks are named once.
- **Active-route check:** `Sidebar` and `BottomNavigation` share one rule (current path equals the item path) instead of two diverging copies; the mobile bar drops a ternary whose two branches are equivalent.

### Out of scope

- Storage helper, field-name unification, event names, search validation, and auth/favorites in services (change `0-3-data-layer-consolidation`).
- Visual redesign of any screen.

## Capabilities

### New Capabilities

- `home-hero`: the decorative background of the Home hero, which rotates through library photographs and falls back to the cover wall.

### Modified Capabilities

None. `app-navigation` (introduced by `0-1-remove-dead-code`) keeps its requirements; only the implementation of the active-route check is shared.

## Impact

- **Code:** `src/App.jsx`, 3 pages, about 10 components, 1 new hook, 1 new service, and 1–2 new or extended data files.
- **Assets:** 3 new WebP images in `public/assets/hero/`, each landscape and around 200 KB like `find-your-bridge.webp`, under a license that allows reuse (the source is noted in the pull request).
- **Behavior:** the hero shows real photographs; every other screen looks and behaves the same.
- **Dependencies:** none.
- **Risk:** medium-low. The route restructuring and the shared hook touch flows the rubric grades (protected routes, live updates), so each gets an explicit manual check.
