# AI-LOG

## Repository Foundation

### Prompt or task

Prepare the initial repository foundation for TheBridge Milestone 1 without implementing the application screens.

### AI suggestions

- Create the required project documentation files.
- Define the seven planned HTML entry points.
- Record the frontend-only scope and the six Milestone 1 user stories.
- Add a simple GitHub Flow collaboration rule.

### Changes adopted

- Added an English README with the academic project context.
- Added `DECISIONS.md`, `figma-link.txt`, and this AI log.
- Added placeholder HTML entry points and empty asset directories.
- Added a static-project `.gitignore`.

### Human changes and review

The project owner reviewed the scope and required that visible project content and documentation remain in English. Code comments will be written in Spanish when they explain non-obvious implementation intent.

### Tests and verification

- Pending manual browser verification of every placeholder page.
- Pending review of the first commit before feature work begins.

### Learning

The repository foundation must preserve the agreed frontend-only scope so future implementation tasks remain small and reviewable.

## Requests, About, and Team Documentation (Integrante 4)

### Prompt or task

Implement `requests.html` and `about.html` and update `CONTRIBUTING.md`, `README.md`, and this log, following the Integrante 4 scope in the team master guide (Requests + About + documentation) on top of the merged v5 base.

### AI suggestions

- Reuse the shared shell (sidebar, header, bottom navigation) copied verbatim from `marketplace.html`, changing only the active navigation state and the `<main>` content.
- Implement the Requests tabs with the WAI-ARIA tabs pattern (roving `tabindex`, arrow key navigation) instead of a custom non-accessible toggle.
- Represent Pending/Accepted/Rejected with an icon plus text label, not color alone, and add an `aria-live` region that explains the practical meaning of each new state.
- Reference `js/data.js` listings by id from the mock request data instead of duplicating book information.
- Draft `about.html` content directly from the existing README sections (problem, target users, why a web app, solution, main flow, six user stories) to keep the two documents consistent.
- Add a visible note on the Requests screen stating the interaction is simulated, per the project's honesty rule.

### Changes adopted

- Added `requests.html` and `js/requests.js` with the tabs, states, actions, and accessibility behavior described above.
- Added `about.html` with the problem, target users, rationale, solution, main flow, six user stories, and a team section with the four real team members' names and general roles.
- Added `CONTRIBUTING.md` documenting GitHub Flow, branch and commit rules, the pull request checklist, and the language rules for the team.
- Updated `README.md`: replaced the placeholder team section with real names and general roles, and updated the Static Prototype section to reflect which screens are implemented versus in progress.

### Human changes and review

The project owner confirmed the real names of all four team members and asked that no specific person be assigned to the My Books/Add Book vs. Create Listing/Listing Details split in written documentation, so both are described with a shared, general role label. The owner also directed that Milestone 1's real base (merged by Integrante 1) be pulled and verified before starting this work, since the repository initially only contained a placeholder skeleton.

### Tests and verification

- Manually reviewed `requests.html` markup for balanced tags and correct `aria-*` attributes against the shared shell copied from `marketplace.html` and `index.html`.
- Verified the Requests mock data ids match real entries in `js/data.js` so covers, titles, and modalities render correctly.
- Pending: keyboard-only walkthrough of the tabs and Accept/Reject buttons, and responsive/dark-mode checks at 375px, 768px, 1280px, and 1440px, before opening the pull request.

### Learning

Confirming the real state of `main` before branching (rather than assuming Milestone 1 was already merged) avoided building the Requests and About screens on top of a placeholder that would have needed to be redone. Keeping user-facing copy directly derived from the README also reduced the risk of the two documents drifting apart.

## HW06 - JavaScript Intermediate

### Prompt or task

Bring the HW06 requirements into the React Marketplace: real-time search over the 24 mock listings, filters by at least three properties, `.map()`, `.filter()`, and `.reduce()` in real operations, and a statistics panel calculated with `reduce`. The original implementation lived in the vanilla `js/marketplace.js` and was lost when the Marketplace was migrated to React.

### AI suggestions

- Port only the pure logic of the vanilla Marketplace (`getFilteredListings` and `computeStats`), not its `innerHTML` rendering.
- Put the logic in `src/services/listingFilters.js` so pages and components do not contain data rules.
- Filter by modality, genre, and condition, and search by title, author, genre, and ISBN while the user types.
- Keep Sale and Rental averages separate because a rental price is charged per period and a sale price is a total.
- Reuse the same `computeListingStats` function for the Home summary instead of writing a second calculation.

### Use of AI for `reduce`

Yes, AI (Claude) was used to write `computeListingStats`. The function starts from `{ total: 0, byModality: {} }` and, for each listing, returns a new accumulator where the total grows by one and that listing's modality entry is replaced with an updated count, price total, and number of priced listings. Averages are calculated afterwards with `getAveragePrice`. `REFLECTION.md` compares this version with an equivalent `forEach` version; both were verified to return the same object for the full dataset.

### Hardest array method

`reduce` was the hardest method, because the accumulator can be any shape and the callback must always return it. Forgetting the return statement or the initial value produces errors that are not obvious at first. `map` and `filter` are easier because each one returns an array with a clear, predictable relationship to the original.

### Changes adopted

- Added `src/services/listingFilters.js` with `filterListings`, `computeListingStats`, `getUniqueValues`, `getNewestListings`, `getAveragePrice`, and `getListingOfferLabel`.
- Added `useListingFilters` to hold the filter state and memoize the filtered listings and statistics.
- Added `ListingFilters`, `FilterSelect`, `ListingGrid`, `ListingCard`, and `ListingStats` components.
- Every listing card links to its dynamic `/listing/:id` route.
- Added `REFLECTION.md`.

### Human changes and review

Pending team review of the reflection wording and of the hardest-method answer, which must reflect the team's own experience.

### Tests and verification

- Verified that typing "andy" shows Project Hail Mary and The Martian without reloading the page.
- Verified combined filters (search + Rental, Fantasy + Like new) and the empty state with Clear filters.
- Verified the stats panel: 24 listings, 7 Exchange, 5 Loan, 6 Rental, 6 Sale, average sale price COP 36,833, and average rental price COP 8,500.
- Verified with a Node assertion script that the `reduce` and `forEach` versions return identical results.

### Learning

The vanilla implementation already had correct logic; the regression happened because logic and DOM rendering were mixed in one file. Separating pure functions from components made the logic reusable in two pages.

## HW07 - Async JavaScript

### Prompt or task

Restore the HW07 offline behavior in React: cache every successful Open Library response in `localStorage`, show saved data with a visible notice when the request fails, and show the error state only when no saved data exists. The mount-time request also had to use `async/await` instead of a `.then()` chain.

### AI suggestions

- Keep the cache inside `src/services/openLibrary.js` so the hook only receives `{ books, savedAt }`.
- Store up to ten queries, keyed by the normalized query, with the ISO date when they were saved.
- Ignore `AbortError` so a cancelled request never falls back to the cache or shows an error.
- Abort the previous request when a new search starts, so a slow old response cannot overwrite a newer one.
- Show a distinct "Showing saved data" notice with the save date and a retry button.

### Async states and AI intervention

Yes, AI (Claude) implemented the cache and rewrote the mount-time effect with `async/await` and `try/catch`. The Marketplace now has four visible outcomes: Loading (spinner), Success (results), Success from saved data (amber "Showing saved data" notice), and Error (red error card with retry). The existing `navigator.onLine` indicator and `online`/`offline` listeners in `AppShell` continue to show the connection status in the header.

### Changes adopted

- Added `searchOpenLibraryWithCache` and a bounded `thebridge:openlibrary-cache` entry in `localStorage`.
- Added the `savedAt` state to `useMarketplace` and the saved-data notice in `OpenLibraryResults`.
- Replaced the `.then()` chain in the mount effect with an `async` function, keeping `AbortController` cleanup.
- Added clearer error messages for offline and unreachable cases.

### Human changes and review

Pending team review.

### Tests and verification

- Verified that a successful search stores the query in `thebridge:openlibrary-cache`.
- Verified offline mode: the header shows Offline, a cached query shows "Showing saved data", and an uncached query shows the error state with "You are offline and there is no saved data for this search yet."
- Verified the header returns to Online when the connection is restored.

### Learning

A cache fallback must distinguish a cancelled request from a failed one; otherwise leaving the page would briefly show stale data or an error that the user never caused.

## HW08 - React Introduction

### Prompt or task

Migrate the HW07 public API experience to React, preserve the loading, success, and error states, split the interface into reusable components, and add persistent favorites using React state and localStorage.

### AI suggestions

- Keep application state and the Open Library request in `App.jsx` so the data flow remains easy to follow during the React introduction.
- Split the interface by responsibility instead of by visual fragments:
  - `SearchBar.jsx` handles the controlled search form.
  - `BookList.jsx` renders the result collection.
  - `BookCard.jsx` represents one book and its favorite action.
  - `LoadingState.jsx` represents the loading state.
  - `ErrorState.jsx` represents failed requests and retry behavior.
  - `FavoritesSection.jsx` displays and removes saved books.
- Normalize the Open Library response in `src/services/openLibrary.js` so presentation components do not depend on the full external API response.
- Persist favorites in `localStorage` and restore them when React initializes.
- Use an `AbortController` in the fetch effect so an unfinished request can be cancelled when the effect is cleaned up.

### Component split reflection

Yes, AI was asked to help split the application into components. The split was based on each part having one clear responsibility and on whether that part could be reused or tested independently. Search, result rendering, individual book cards, UI states, and favorites therefore became separate named components instead of keeping the full interface inside `App.jsx`.

I agree with this split because it keeps the UI components small while `App.jsx` currently makes the main React state and API flow easy to inspect. For Milestone 2, once routing is introduced, I would move Marketplace-specific state and behavior into a `MarketplacePage` component or a dedicated hook so `App.jsx` can focus mainly on application routing and top-level architecture.

### Changes adopted

- Rebuilt the Open Library search experience in React.
- Added explicit loading, success, and error rendering.
- Added reusable SearchBar, BookList, BookCard, LoadingState, ErrorState, and FavoritesSection components.
- Rendered collections with `.map()` and stable `key` values.
- Added favorite and unfavorite actions using `useState`.
- Added persistent favorites through `localStorage`.
- Added retry behavior after a failed API request.
- Kept the existing online/offline indicator and made it visible on mobile layouts.

### Tests and verification

- Ran the full ESLint command with zero errors and zero warnings.
- Ran the Vite production build successfully.
- Verified Open Library search with multiple queries.
- Verified loading, success, and forced offline error states.
- Verified retry after restoring the network connection.
- Verified adding and removing favorites from both results and the Favorites section.
- Verified favorites persist after a page reload.
- Verified the online/offline indicator on desktop, tablet, and mobile layouts.

### Learning

Component boundaries are clearer when they follow responsibilities rather than arbitrary visual sections. Keeping external API normalization separate also makes the React components simpler and reduces coupling to Open Library's response format.

## HW09 - React State

### Prompt or task

Implement TheBridge's main Marketplace feature in React using multiple pieces of state, a mount-time data fetch with cleanup, a controlled search form, inline validation, and a validation rule beyond checking for an empty field.

### AI suggestions

- Keep the Marketplace book discovery flow as the main project feature instead of adding a generic demonstration form.
- Use separate state for the search input, validation message, active query, books, favorites, request status, and request error.
- Fetch the initial Open Library results when the component mounts.
- Use `AbortController` so the initial request can be cancelled if the component unmounts before the response finishes.
- Keep the search input controlled with `value` and `onChange`.
- Validate the search while the user types and require at least three characters for a meaningful query.
- Clear the search field only after a successful search.
- Continue updating favorites immutably with `filter`, spread syntax, and new arrays.

### useEffect and cleanup reflection

Yes, AI was asked to help implement the `useEffect` cleanup logic. I understand that the function returned by `useEffect` runs when the component is unmounted. In this case, it calls `controller.abort()`, cancelling the pending initial Open Library request so that an unfinished request does not continue unnecessarily after the component is gone.

The initial API request uses an empty dependency array because it must run only once when the Marketplace component mounts. The effect uses the constant default query and functions defined outside the component, so it does not depend on changing React state or props.

### Dependency array verification

I verified the dependency arrays by checking every value used inside each effect.

- The initial Open Library effect has `[]` because it intentionally runs only on mount and does not depend on changing component state or props.
- The favorites persistence effect uses `[favorites]` because it must write to `localStorage` every time the favorites array changes.
- Values that change as a result of the effects, such as `books`, `status`, and `error`, are outputs of those effects rather than dependencies that should trigger them again.

This also avoids accidental request loops.

### Changes adopted

- Kept Marketplace search as the central project feature.
- Added multiple independent pieces of React state.
- Added a mount-time Open Library request with `useEffect(..., [])`.
- Added `AbortController` cleanup for the initial request.
- Kept favorite updates immutable.
- Implemented a controlled search input using `value` and `onChange`.
- Added inline validation while the user types.
- Added a minimum three-character validation rule.
- Reset the search field after a successful submission.
- Preserved loading, success, error, retry, favorites, and localStorage behavior from HW08.

### Tests and verification

- Verified that entering fewer than three characters immediately displays an inline validation message.
- Verified that a valid search requests new Open Library results.
- Verified that the input resets after a successful search.
- Verified that ESLint passes with zero errors and zero warnings.
- Verified that the Vite production build succeeds.
- Verified that the HW09 controlled-form and validation logic appears within the portion of `src/App.jsx` inspected by the provided autograder.

### Learning

A dependency array should describe the external changing values an effect depends on, not every variable mentioned around the component. Cleanup is especially important for asynchronous effects because a component may disappear before a network request finishes.

## HW10 - React Router and Application Architecture

### Prompt or task

Migrate the complete TheBridge Milestone 1 frontend into a React application with React Router v6, page-level routing, a dynamic listing route, protected routes, a 404 page, reusable components, separated mock data, and an architecture suitable for deployment on GitHub Pages.

### AI suggestions

- Use `BrowserRouter`, `Routes`, and `Route` as the top-level routing structure.
- Keep page-level components inside `src/pages/`.
- Keep reusable interface pieces inside `src/components/`.
- Move mock data into `src/data/` and application logic into services and hooks instead of placing it inside page components.
- Use `/listing/:id` with `useParams()` for dynamic listing details.
- Protect personal routes with a local authentication flag and redirect unauthenticated users to `/login`.
- Use `useLocation()` in shared navigation so the current route is visually identified.
- Preserve the existing Milestone 1 flows while replacing legacy HTML navigation with React Router `Link` and `useNavigate`.
- Refactor components that had grown too large by extracting meaningful responsibilities rather than splitting files only to satisfy a line count.
- Add a GitHub Pages SPA fallback so direct BrowserRouter URLs can still load the React application.

### Folder structure reflection

Yes, AI was asked to help organize the React folder structure.

The suggested architecture was not followed as a completely new structure. It was modified to preserve the shared Milestone 1 shell and the React work already completed in HW08 and HW09.

The resulting structure separates responsibilities into:

- `src/pages/` for routed screens.
- `src/components/` for reusable UI.
- `src/data/` for local mock and configuration data.
- `src/services/` for storage, validation, API, and domain logic.
- `src/hooks/` for reusable React state and behavior.

This adaptation avoided rebuilding parts of the project that were already working while still improving separation of concerns.

### Hardest architecture decision

The hardest decision was migrating every Milestone 1 screen to React Router without breaking the existing flows or allowing the legacy root HTML files to interfere with Vite routing.

The original static HTML files used paths such as `marketplace.html`, `my-books.html`, and `create-listing.html`. When React routes such as `/my-books` and `/create-listing` were introduced, those legacy files could conflict with the development server and cause the browser to load the old page instead of the React route.

The solution was to archive the legacy HTML screens, move internal navigation to React Router, and keep the existing data and interaction behavior in React components, services, hooks, and data modules.

### Changes adopted

- Added React Router v6 with `BrowserRouter`, `Routes`, and `Route`.
- Added routes for Home, Marketplace, My Books, Add Book, Create Listing, Requests, About, Login, and the 404 screen.
- Added the dynamic `/listing/:id` route using `useParams()`.
- Added protected routes for personal user flows using a local authentication flag and `Navigate`.
- Added a dedicated Login page for the protected-route demonstration.
- Added a wildcard 404 route.
- Migrated Requests and About from the Milestone 1 static implementation into React.
- Preserved the Requests Received/Sent tabs and Accept/Reject interaction using React state.
- Migrated Add Book, My Books, Create Listing, and Listing Details into routed React screens.
- Moved reusable mock data into `src/data/`.
- Moved storage, validation, status, and external API behavior into `src/services/`.
- Added custom hooks for Marketplace and Add Book search behavior.
- Refactored large Marketplace, My Books, Listing Details, Add Book, and Create Listing components by responsibility.
- Replaced internal `.html` links and `window.location` navigation with React Router `Link` and `useNavigate`.
- Added route-aware shared navigation using `useLocation()`.
- Added a GitHub Pages SPA fallback that creates `dist/404.html` after each production build.

### Tests and verification

- Ran ESLint repeatedly during the migration with zero errors and zero warnings.
- Ran the Vite production build successfully.
- Verified the GitHub Pages postbuild step creates both `dist/index.html` and `dist/404.html`.
- Verified protected navigation redirects an unauthenticated user to `/login`.
- Verified local prototype login redirects into the protected My Books route.
- Verified Add Book can add a selected book to the local library.
- Verified My Books displays locally added books.
- Verified Create Listing reads the selected book from the query string and validates modality-specific fields.
- Verified the Requests tabs render received and sent requests.
- Verified Accept and Reject update pending received requests without reloading the page.
- Verified the React source no longer contains links to the legacy `.html` pages.
- Verified the deployed GitHub Pages application loads the root route, protected Requests route, and a direct dynamic `/listing/:id` route.
- Verified the simulated Listing Details request flow for Sale and Exchange.
- Verified the completed About page includes the six-step flow, six user stories, and team information.
- Verified production assets are copied into `dist/assets` during the Vite build.
- Verified responsive layouts at 375px, 768px, 1280px, and 1440px without horizontal overflow or broken navigation.

### Learning

Routing changes affect more than URLs. Migrating a static multi-page frontend to React required coordinating route ownership, shared navigation, data placement, authentication simulation, browser history, and deployment behavior.

The most useful component refactors were the ones based on responsibility. Moving API behavior into services and hooks and moving repeated interface sections into reusable components made the routed pages easier to understand without fragmenting the project unnecessarily.

## Milestone 2 - Audit and Completion

### Prompt or task

Audit the repository against the cumulative HW06-HW10 requirements and fix every gap that prevented Milestone 2 from being complete.

### AI suggestions

- The audit found that the React Marketplace no longer showed the community listings, the Open Library cache was missing, `REFLECTION.md` did not exist, and `npm run lint` reported one error.
- Restore the Home "community at a glance" summary and the recently shared listings from Milestone 1 using the same services as the Marketplace.
- Make the request dialog fully keyboard accessible: move focus into it, keep Tab inside it, close it with Escape, and return focus to the button that opened it.
- Replace the tab roles in the My Books filters with toggle buttons (`aria-pressed`), because the buttons filter a list instead of switching tab panels.

### Changes adopted

- Fixed the lint error in the archived `js/add-book.js` (empty `catch` block left after removing comments).
- Added `useDialogFocus` and connected it to `ListingRequestModal`.
- Updated `MyBooksFilters` to use `aria-pressed`.
- Added `CommunitySummary` and `FeaturedListings` to the Home page.
- Changed the Open Library panel heading to `h2` so the Marketplace has a single `h1`.
- Updated the README deployment URL and deployment instructions.

### Human changes and review

Pending team review before submission.

### Tests and verification

- `npm run lint`: 0 errors and 0 warnings.
- `npm run build`: successful.
- Verified in the browser: listing search and filters, stats, listing card navigation to `/listing/:id`, saved-data and offline states, the request dialog keyboard behavior, the protected route redirect, and no horizontal overflow at 375px.

### Learning

Migrating screens one by one can silently drop behavior that belonged to an older homework. Auditing against the cumulative requirements, not only the latest assignment, exposed the regressions.

## Milestone 2 - Final Rubric Compliance

### Prompt or task

Audit the final Milestone 2 code against the literal HW06-HW10 requirements and close the remaining gaps with the smallest safe changes, without visual or behavioral changes.

### AI suggestions

- HW09 asks for a data fetch on mount with `[]` as the dependency array. After the random catalog discovery was added, the Marketplace mount effect depended on `[discoveryQuery]`.
- HW10 asks that no component exceed about 80 lines. Twenty-one `.jsx` files were above 80 lines, and the largest had 259 and 240 lines.
- Extract components by responsibility and copy the existing JSX and class names exactly, so the rendered HTML does not change.

### Changes adopted

- `useMarketplace` now picks the random discovery query inside the mount effect. The effect uses `useEffect(..., [])`, keeps the `AbortController` cleanup (`return () => controller.abort();`), and sets the active query after the request succeeds or fails. No lint rule was disabled.
- Split the largest components by responsibility:
  - `DesiredBookPicker` into `DesiredBookSearch`, `DesiredBookResults`, `DesiredBookResultList`, and `SelectedDesiredBook`.
  - `ListingQuickView` into `QuickViewHeader`, `QuickViewSummary`, `QuickViewDetails`, `QuickViewActions`, `QuickViewBackdrop`, and the `useBodyScrollLock` hook.
  - `ListingRequestModal` into `RequestDialogHeader`, `RequestOfferRows`, and `RequestDialogActions`.
  - `ListingDetailsPage` into `ListingOverview`, `ListingRequestCta`, and `ListingUnavailable`.
  - `TopHeader` into `MobileBrand`, `NetworkStatus`, and `ThemeToggle`.
  - Smaller extractions in Requests, My Books, Marketplace, Create Listing, Add Book, the catalog book card, the hero carousel, and the sidebar.
- Moved the Create Listing form state and validation calls into the `useListingForm` hook.
- Routes, data shapes, localStorage keys, services, the Open Library behavior, and styles were not changed.

### Human changes and review

Pending team review before submission.

### Tests and verification

- `npm run lint`: 0 errors and 0 warnings.
- `npm run build`: successful. `dist/index.html` and `dist/404.html` were generated.
- Captured the rendered HTML of 29 application states before and after the refactor, with deterministic randomness and a fixed localStorage state. All 29 states were identical.
- Verified in the browser: random discovery on mount, manual search, loading, success, error, saved data, favorites persistence, listing search and filters, stats, quick view focus trap and Escape, the request modal, all four Create Listing modalities, created listing persistence, dynamic listing details, request persistence, My Books status updates, protected routes, login, 404, dark mode, and no horizontal overflow at 320px, 375px, 768px, 1280px, and 1440px.
- Files still above 80 lines: `ListingFieldControls.jsx` (91 lines, three small components), `RequestsPage.jsx` (90), `App.jsx` (86, the route table), `ListingRequestModal.jsx` (83), and `ExchangeBookOptions.jsx` (83).

### Learning

Refactors for a line limit are safest when each extraction matches an existing responsibility and the rendered output is compared before and after. Comparing the rendered HTML found no differences, which made it possible to split large components without changing the interface.

## Issue #9 — Full-stack architecture and API contract (2026-10-27)

### Task and workflow

The user delegated the complete issue #9 documentation task after reviewing its step-by-step plan. The assigned workflow was `bmad-agent-architect` followed by `bmad-architecture`, on branch `docs/architecture`. The audience is Juan and Jorge as required reviewers and the contributors who will implement the client/API integration.

### Inputs and assistance adopted

- Updated from `main` at `dc7bd2c` and read the integrated AGENTS/CONTRIBUTING policies.
- Read the issue, existing client services, the draft PRD at PR #13 commit `6f12ef9210f8ffa533fb0e21dd8ccc1deac6f275`, its brief/addendum, and the original HW11–HW15 rubrics. Juan-owned draft artifacts were read without copying or editing them on this branch.
- Resolved the local BMAD architect/workflow configuration and recorded constraints, proposals and assumptions through the shared memlog script.
- Proposed one canonical root `api-design.md`, real root graded route/model/type modules, a layered Express boundary, transactional request transitions, controlled Admin bootstrap and a single-origin Vercel target.
- Checked current package metadata and primary runtime, hosting, database and authentication documentation; no dependency was added to the application.
- Ran independent input-reconciliation and architecture-gate checks required by the skill. These are internal artifact checks, not the human code review or approval required by the team.

### Corrections during verification

Input reconciliation identified missing participant-visible exchange metadata, incomplete LibraryBook/activity references, filter options lost through pagination, an untestable HW11 create sequence without fixture copies, expiry monitoring limited to protected views, and missing weekly deployment/AI-LOG gates. These were corrected in the documentation. The React seed version was corrected from the package.json lower bound to lockfile-resolved 19.3.0.

### Human review and remaining decisions

Pending review by Juan and Jorge. All new architecture choices remain proposed. Product assumptions are indexed as A-1–A-5; Q-1 explicitly gates moderation of Reserved listings until the PRD owner defines how Accepted requests and Lent books are settled. Hosting resources, the shared limiter and grading-source confirmation have named follow-up gates. No human approval, backend behavior, production URL or course grade is invented.

### Verification and scope

- `npm run lint`: passed with zero errors and warnings.
- `npm run build`: passed; the existing frontend bundle and SPA fallback were generated.
- BMAD spine mechanical lint: passed with zero findings.
- Contract/document checks cover operation-ID uniqueness, method/path uniqueness, FR/NFR traceability, JSON examples and relative links; detailed results and the independent-review disposition are recorded in the architecture handoff.
- No application code, package files, assets, deployment settings, peer-owned PRD or team policies were changed. Publication and PR creation remain a human action under AGENTS.md.

### Learning

An API contract must describe enough data for both sides to implement independently, including the participant's view of an exchange and the global options behind a paginated list. Explicit product gates are more useful than silently inventing state transitions for books that may already be physically lent.

## Issue #9 — Reconcile the updated PRD (2026-10-28)

The user asked to check and perform remaining assigned work. Live GitHub issue and pull-request metadata confirmed issue #9 is Edwin's only open assigned implementation/planning task; PRs #7 and #13 both request Edwin's review. Issue #11 names Edwin as a future reviewer, but its owner has not opened the baseline-spec PR. Peer reviews were conducted from separate worktrees using the BMAD review layers; notes and copy-ready Spanish comments remain outside this branch. No peer-owned source, PRD, approval or GitHub comment was modified.

PR #13 advanced from 6f12ef9 to e8545a2 and became ready for review. Reconciled its explicit page-size default (10), Pending offered-copy guard, confirmed product assumptions and Accepted-request moderation effect into architecture, contract version 2, decisions, spine and handoff. The Open Library cap remains 20. Completion timing, changed-term acceptance and safe physical availability after moderation still require product decisions; this work does not resolve them on Juan's behalf or approve our own architecture.

Verification checks contract operation uniqueness, all 28 FR/19 NFR identifiers, JSON examples, pagination consistency, relative links/anchors and BMAD spine lint. These are documentation checks; the frontend lint/build evidence above remains dated 2026-10-27 and no new runtime validation is claimed. AGENTS still requires local commits only; the user publishes the branch and opens the draft PR.

### Explicit publication authorization

After reviewing the prepared comments, the user explicitly authorized publishing both peer reviews and then instructed the agent to handle necessary commits, pulls, pushes and publication while preserving review gates. Git Credential Manager authenticated as AndresMonca; PR heads and authors were checked before posting. Posted the Gate 1 spec approval on #7 at bfc6e29 and a Request changes review on #13 at e8545a2. No peer code/document was edited. This subsequent authorization permits publishing this architecture branch and draft PR without changing AGENTS, merging, deploying, self-approving or implementing unapproved code.

## Issue #9 / PR #14 — Address both human reviews (2026-10-28)

### Authorization and review provenance

The user had deferred this PR until both reviews arrived, then explicitly instructed the agent to make the required changes following the contract. Juan requested changes on 9f12986; Jorge approved that same revision. Those are human review states for the earlier content, not approval of these corrections. The existing session explicitly authorizes commits, pulls, pushes, PR publication and review comments through the account holder's own AndresMonca identity. There is no documented team-wide approval of a permanent exception to AGENTS; none is claimed, and no policy file or reviewer identity is changed.

### Assistance and changes adopted

Used `bmad-architecture` in update mode with stable AD identifiers. Marked FR-24 coverage partial, bounded the transaction runner to three body attempts with jitter and three commit calls per transaction, separated unknown-commit reconciliation from body replay, and separated LibraryBook internal revision from its public domain version. Incorporated the six review follow-ups: explicit rejection causes, public bearer behavior, JWT startup validation, dummy bcrypt comparison, client-storage residual-risk acknowledgement and ADMIN-05 reason validation. Rechecked primary MongoDB/Mongoose/JWT/bcrypt references; these are documented implementation requirements, not installed code.

The newer PRD at a1fc15f remains unmerged. Reconfirmation and Reserved-moderation/completion reconciliation stays in issue #15 after PR #13 merges, as the issue and Juan's review specify. No peer-owned PRD was edited and no newer product decision was silently replaced. The proposed client-storage risk is not labelled accepted by the team.

### Verification and human follow-up

The architecture method requires independent input/gate/editorial checks; they are internal artifact checks and never formal approval of our own PR. Deterministic checks cover the spine, unchanged operation identifiers, traceability, JSON examples, local links/anchors, review-item consistency and documentation-only scope. The updated revision will be published in the existing branch and both reviewers asked to assess it. Backend retry/auth behavior remains future test evidence; the implementation stories must exercise the added failure cases before approval. Issue #9 remains open; no merge or deployment is performed.

Lint and build passed on this correction, with the existing 147-module frontend build preserved. Spine lint returned zero findings and contract checks passed for 31 unchanged operation IDs, 28 FR/19 NFR references and five JSON examples. Independent rubric/input and technology checks passed. The seam reviewer identified one clarification, now applied: only a protected-operation 401 matching the active session generation/account invalidates that session; AUTH-02 wrong credentials remains a form error. The structure suggestion to split the retry policy into four paragraphs was applied without changing its sentences. The four Mermaid blocks remain unchanged from their previously parsed form. No new browser or backend runtime verification is claimed for these documentation-only changes.

## Story 0.1 - Remove Dead Code

### Prompt or task

Remove code and files with no consumers from the application and drop the "Listing Details" entry from the navigation, keeping the listing detail routes and the protected brand and hero assets.

### AI suggestions

- Plan the change with `/opsx:propose` as `0-1-remove-dead-code` and implement it with `/opsx:apply` after the spec was approved.
- Delete the two iCloud conflict copies (`useListingForm 2.js`, `MyBooksHeader 2.jsx`), the unused `SearchBar.jsx`, the legacy HTML prototype (`legacy/`, `js/`, `css/`, `assets/`), and the three seller photo SVGs.
- Remove `searchAddBookCatalog`, `isSimulatedSearchError`, `extraCatalogBooks`, `addBookCatalog`, and the `sellerPhotos` field, then drop the `activePage` prop from `AppShell` and the pages.
- Remove the "Listing Details" navigation entry with its sidebar special case and `NavIcon` case, un-export symbols without consumers, and strip the UTF-8 BOM from seven files.
- Archive the change with `/opsx:archive`, which synced the delta into `openspec/specs/app-navigation/spec.md`.

### Changes adopted

- All deletions and removals listed above, in commits `5d755ff` (code) and `9969915` (archive).
- `FieldError` stays exported, as the proposal allows.
- Listing detail routes remain reachable from the listings, and `public/assets/brand/thebridge-logo.svg` and `public/assets/hero/find-your-bridge.webp` were not touched.

### Human changes and review

The spec was approved by the reviewer at Gate 1 (`bfc6e29`) before any code was written. The reviewer asked to check the five mobile bar destinations and `aria-current`, including a detail page where no entry may be marked. At Gate 2 the reviewer ran `bmad-code-review` on `9969915`, found no functional regressions, and requested this log entry.

### Tests and verification

- `npm run lint` and `npm run build`: both exit with code 0.
- `openspec validate --all --strict --no-interactive`: passes.
- `npx knip`: reports only `FieldError`, the planned exception.
- `git ls-files | grep -E ' 2\.|^legacy/|^js/|^css/|^assets/|SearchBar|seller-copy'` prints nothing.
- Reviewer browser check on the build with base `/TheBridge/`: 36 route and width combinations (375, 768, 1280, and 1440 px), navigation and `aria-current`, quick view and Escape, adding a book, publishing a Sale listing, sending and accepting requests, and theme persistence, with no JavaScript errors or local HTTP failures. Catalog searches used controlled Open Library responses, so the external service availability was not tested.

### Learning

Deleting by consumer count is safe only when each removal has a grep or Knip check that proves nothing references it, and the spec's verification line per task made that check repeatable. A commit co-author line records that AI helped, but the team log is what documents what was adopted and how it was verified.

## Story 0.2 - Rubric Compliance

### Prompt or task

Apply the approved `0-2-rubric-compliance` change: move content out of components, bring every `.jsx` file to 80 lines or fewer, and fix the Home hero carousel that requests three images that were never added.

### AI suggestions

- Implement with `/opsx:apply` on the same branch and pull request, after the spec was approved at Gate 1 (`bb7da73`).
- Move the hero file list, quick searches, My Books filter statuses, and mobile bar selection to `src/data/`, and the MARC language table to `formatLanguage` in `src/services/languages.js`.
- Nest the four protected routes under one `ProtectedRoute` layout route that renders `<Outlet />`.
- Replace the three repeated "reload on storage events" effects with `useStoredState(load, eventNames)`.
- Split `ListingFieldControls.jsx` into `FieldError`, `DurationSelect`, and `PriceInput`, extract `ExchangeBookOption`, and name `isExchange` once in `ListingRequestModal`.
- Reduce the active-route check in both navigations to `location.pathname === item.path`.

### Changes adopted

- All of the above, in commit `34b11cb`; task ticks in `1d4cd20`.
- `MyBooksPage` builds its counter seed from `myBookFilters`, so the chips and counters share one source.
- Storage keys, event names, and service APIs were not changed (that belongs to `0-3`).
- The change was archived with `/opsx:archive` after all 8 tasks passed, which synced the new `home-hero` capability into `openspec/specs/home-hero/spec.md`; `openspec validate --all --strict` passes.

### Human changes and review

The spec was approved by the reviewer at Gate 1 before any code was written. During implementation the AI marked task 2.2 as done after verifying only part of it; the owner asked why, the task was unticked, and it was ticked again only after the full check below.

### Tests and verification

- `npm run lint` and `npm run build`: both exit with code 0; no `.jsx` file exceeds 80 lines.
- Protected routes: logged out, `/my-books`, `/add-book`, `/create-listing`, and `/requests` redirect to `/login`; logged in, each opens its page.
- Two-tab check on the dev server: adding a book through Add Book updated an already open My Books (11 to 12 books), publishing a Sale listing updated an already open Marketplace (25 to 26 listings), and accepting a request updated Requests, all without reload.
- Create Listing shows the price and duration errors for an empty Rental; an Exchange request shows the book error, clears it on selection, and is sent.
- All ten routes render without horizontal overflow at 375 and 1280 px in light and dark mode.
- Hero (task 1.1): the three photographs are `library-01.webp`, `library-02.webp`, and `library-03.webp` (1600x1063, 1600x900, 1600x1200; 137 KB, 190 KB, 203 KB), converted from the Unsplash originals listed below; the second was cropped from a vertical original to a horizontal band. On the dev server they rotate every 7 seconds in order with a three-position indicator hidden from assistive technology; with reduced motion emulated one photograph stays fixed for 15 seconds; with one request aborted the hero rotates between two with two positions; with all three aborted it shows the cover wall and no indicator.
- Visual check (task 3.2): 10 routes at 375 and 1280 px in light and dark mode were captured on `main` and on this branch with a seeded `Math.random`, empty storage, and animations disabled, then compared pixel by pixel. Every screen is identical or differs only by noise that also appears between two runs of the same build; Home differs only inside the hero. Open Library requests were blocked in both builds, so catalog data was not compared.
- Console: Home shows no errors with the new images. The remaining console messages are an Open Library CORS error from localhost and a missing `favicon.ico`, both outside this change.
- Photograph sources, each page opened and checked: `library-01` by vmokry, https://unsplash.com/photos/books-on-shelf-G-4wX5tZNuE; `library-02` by sevtovp, https://unsplash.com/photos/an-ornate-librarys-ceiling-and-bookshelves-are-featured-8IMmLCEayfQ; `library-03` by space_launch_system, https://unsplash.com/photos/a-library-with-books-on-shelves-fvWUPOG99cY. All three are under the Unsplash License (https://unsplash.com/license), which allows free use without attribution.
- The first set of photographs, 365x273 and 627x350 files whose reported sources (iStock, Vecteezy) had no links and whose reported terms could not be matched to a free license, was replaced. A later set of credits with Unsplash and Pexels links was not used: both Unsplash links returned 404 and the Pexels link was a search page.
- Text over the hero stays legible with each photograph in light and dark mode at 375 and 1280 px, checked on screenshots with the photograph forced as the active one.

### Learning

A verification line that lists several observable results needs each one checked, and a check that navigates to a page proves less than one against a page that is already mounted. The log should say which of the two was run.

## Issue #10 - Baseline specs for Marketplace, My Books, and auth (2026-10-30)

### Prompt or task

Run `/opsx:propose` for the change `baseline-marketplace-mybooks-auth`, describing the current behavior of Marketplace, My Books, Add Book, and sign-in as `auth`, `marketplace`, and `my-books` specs, without changing code.

### AI suggestions

- Read the current client (`App.jsx`, `LoginPage.jsx`, the Marketplace, My Books, and Add Book pages with their components, hooks, and services) and write the proposal, three spec deltas, design, and tasks.
- Keep Add Book inside `my-books`, and keep the Open Library catalog search and Favorites out of `marketplace`, because the issue sends catalog search to changes 0-1 to 0-3.
- Describe what the code does instead of what the PRD asks for, and list the differences in `design.md` as observed gaps.
- Use the sample data's real values in scenarios (24 listings, "COP 36,833" average sale price, "The Hobbit" for Loan plus Fantasy).

### Changes adopted

- Everything above, as committed on `docs/spec-baseline-daniel`. No file under `src/` or `public/` changed.
- Two statements were corrected during drafting after checking the code: the activity note on a Published book appears below the "Listed as" line instead of replacing the action, and the confirm step shows the language as its English name.

### Human changes and review

Pending. Jorge reviews the spec at Gate 1; the manual browser pass in task 2.4 is still to be done by the owner.

### Tests and verification

- `openspec validate baseline-marketplace-mybooks-auth --strict`: passes.
- `npm run lint` and `npm run build`: both exit with code 0.
- The filtering, statistics, offer-label, price-format, request-activity, and library-book logic was run in Node against the real modules with a stand-in for `localStorage`, and its output matched every number and string used in the scenarios. The accent-insensitive search was checked with a synthetic listing because the sample data has no accented text.
- Manual browser pass (task 2.4) done by the owner on /login, /marketplace, /my-books, and /add-book at 375px and 1280px; every scenario matched the specs.

### Learning

Running the pure logic against the real modules caught wording that reading alone would have missed, so scenario values are safer when copied from program output than from memory of the code. Behavior that lives only in the browser still needs a manual pass before the spec can be called verified.

## Issue #15 — Reconcile architecture and API contract with the merged PRD (2026-10-30)

### Task and workflow

Incorporate the PRD decisions of PR #13 that issue #9 had left open: Request reconfirmation after a Listing edit (FR-11, FR-18, FR-19), Reserved-listing removal (FR-24), and Loan/Rental completion after the physical return, also on a Removed Listing (FR-21). Documentation only, on `docs/reconcile-architecture-prd`; the PRD was not edited.

### Assistance and changes adopted

- Read FR-11, FR-15 and FR-17 to FR-24 in the merged PRD and traced each rule through `api-design.md`, architecture §4 and §8, and the spine.
- Added the `needsReconfirmation` field to Request and one operation, REQUEST-08 (`PATCH /api/requests/:id/reconfirm`); no existing operation ID changed.
- Rewrote the transition matrix: edit flags Pending requests and releases or keeps Offered Books, accept refuses a flagged request, reconfirm swaps the Offered Book atomically, complete also applies to a Loan/Rental on a Removed Listing, and removal covers Reserved Listings by modality.
- Closed A-1, A-3 and Q-1, replaced the "unmerged PR #13" statements, updated traceability (FR-24 is no longer partial) and added the downstream tests to §9.

### Design choices that go beyond the PRD text

- A listing edit also increments the version of requests that are already flagged, so a requester holding an older If-Match gets 409 instead of agreeing to terms they have not seen.
- A released Offered Book is stored as null, which keeps the one-active-offer-per-copy index valid; the request keeps its original quoted modality until it is reconfirmed.
- An edit that does not change modality or terms flags nothing, following the wording of FR-11.

These need Edwin's and Jorge's review as contract decisions; the PRD does not state them.

### Verification and scope

The three documents were cross-checked for leftover statements about an unmerged PRD, a partial FR-24 and the temporary Reserved 409, and the new table rows were checked for column counts. No code, runtime or backend behavior was exercised; the new rules are required downstream tests, not tested behavior.

### Learning

A decision that changes a state machine has to be traced through every place that restates it (contract, matrix, assumptions table, spine, traceability), because each copy otherwise keeps the old answer.

### Review correction (PR #19, requested by Andrés)

Andrés found three contract contradictions in `3f55f67`; all three were confirmed against the text and fixed in this PR:

- **Terminal requests after a released offer.** The nullability rule now applies only to unflagged Pending and to Accepted requests. Rejected, Cancelled and Completed requests keep their last offer, or null if it was released, hold no copy, and have `needsReconfirmation` false.
- **Snapshots that REQUEST-08 replaces.** A new "Quote snapshots" rule in `api-design.md` §2 lists the only two changes allowed: a listing edit to a non-Exchange modality releases the offer, and REQUEST-08 replaces the quote, `listing.modality` and the offer together. Juan chose not to keep earlier quotes as history, since no FR requires it.
- **Reserved status versus a Pending hold.** A Pending offer keeps its copy Available and blocks it through derived activity; keeping, moving or releasing it changes only the internal revision. The PRD's "keeps its Offered Book Reserved" is mapped to that hold, and status Reserved still starts at acceptance.

Two acceptance cases were added to architecture §9: reconfirm an offer and then cancel or reject it, and end a flagged request whose offer was released through each rejection path. These remain downstream tests; no backend exists yet.


## Issue #23 — Milestone 3 contract preparation (2026-11-01)

### Task and assistance

The account holder delegated assigned TheBridge tasks. Codex read issue #23, its explicit scope cuts shared by #22–#25, the canonical API design, team policy at main b0d5c33 and the original HW11/HW12 README files from the supplied ZIP. AI proposed contract edits before Express domain code, as HW11 requires.

### Adopted and pending work

API design version 5 removes client version preconditions and reconfirmation, blocks edits while Pending requests exist and selects the Mongoose transaction helper instead of the custom retry runner. Architecture/spine explicitly separate this delivery profile from the retained future design. No peer-owned PRD or Account/auth implementation was edited. No models/routes/seed or completed endpoint/deployment evidence is claimed in this first commit.

### Human review and validation

The coordinator supplied the scope cuts in the issue. Daniel is the assigned task reviewer; review is pending. Foundation #21 is under review and #22 authentication must merge first. Checks cover Markdown diff, unchanged operation paths except deferred REQUEST-08, DTO/header/example consistency and JSON syntax. These are documentation checks, not passing database, endpoint or preview tests.

### Course reflection

AI helped reconcile the API design before backend implementation. The important REST distinction is separating server state conflicts (409) from transport/version preconditions intentionally omitted from this delivery. Schema/validation results and curl evidence will be recorded only after implementation against the actual authentication dependency.
### Gate 2 correction (PR #17, requested by Andrés)

Andrés found that the hero carousel kept rotating when reduced motion was turned on while Home stayed open: the effect read the media query once and only re-ran when the image count changed. The rotation now lives in `src/hooks/useRotatingIndex.js`, which listens to the media query `change` event, clears the interval when the preference turns on, restarts it when it turns off, and removes the listener on unmount. `HeroCarousel.jsx` dropped from 75 to 59 lines.

Verification: lint and build exit 0. On the dev server with Home open and no reload, the active photograph moved from 01 to 02 after 7 seconds, stayed on 02 for 15 seconds after reduced motion was emulated, and resumed to 03 after 7 seconds once the preference returned to no preference.

## Story M3 foundation / PR #21 — Express API base on Vercel (2026-11-01)

### Task and workflow

Claude Code (Opus 5.5) built the Express 5 + TypeScript foundation (shared types, CORS, helmet, rate limits, JSON error envelope, pagination, OPS-01 health, `vercel.json`) and moved deployment from GitHub Pages to Vercel. A later Claude Code session (Sonnet 5.5) addressed the human review by Andrés on `a92b037`.

### Changes adopted after review

- Health now checks the current `mongoose.connection.readyState` and reconnects when it is not connected, so a dropped connection returns 503 instead of a stale 200.
- The storage check moved from every `/api` request into the routes that need it, so an unknown route returns the JSON 404 during an outage.
- `/api/health` answers other methods with 405 and an `Allow` header.
- Body-parser errors keep their own codes: unsupported charset is 415, an undecodable gzip body is 400; any other unrecognized error stays a sanitized 500.
- `.env.example` restored with only the variables `readEnv()` reads; the README setup steps match it.
- Review point 1 (contract after dropping versions and reconfirmation) is handled in the documentation PR #26, not in this one.

### Human review and validation

Andrés reviewed `a92b037` and requested these changes; each reproduction was re-run as a repeatable HTTP check in `tests/api.test.ts` (Express on an ephemeral port, MongoDB connection simulated, no credentials or real data). Local results: `npm test` 9 of 9 passing, `npm run lint`, `npm run typecheck` and `npm run build` clean. Not verified: the Vercel deployment of the new commit, its `/api/health` and deep links; the coordinator must check them after merge.

### Learning

A guard applied to a whole prefix (`/api`) hides routing decisions behind infrastructure state; attaching it to the handlers that need it keeps 404 and 405 independent of the database.

## Issue #23 - M3 library and listings implementation (2026-11-08)

### Task and assistance

After #29 merged, Codex implemented COPY-01..05 and LISTING-01..07 against API design v5 and the original HW11/HW12 course requirements. The account holder delegated implementation, commits, publication and assigned reviews. The existing branch and PR #26 are retained; Daniel remains the independent reviewer.

### Adopted changes

Added validated LibraryBook/Listing models, shared metadata/term validation, root routers, explicit DTOs, filtered search/statistics and an idempotent password-hashed demo seed. Snapshots remain immutable. Private library reads are owner-scoped; public populated owners contain only id/name. Mongoose transactions and conditional internal revision writes coordinate with #28, without public versions, reconfirmation or a custom retry runner. Tombstones retain historical references. Request state is read/updated through the existing collection without a duplicate Request model; activity remains null under the task allowance.

The provisional model vocabulary from #28 was reused and adapted so these upstream models depend on shared validation modules rather than downstream Favorite/Request models. Integration must keep the reviewed #23 models and their tombstone filters. See docs/m3-listings.md for exports, concurrency and deletion rules.

### Validation and human review

Local verification: twelve integration tests on a real disposable MongoDB replica set, including an actual curl sequence for all twelve task operations, publication/request/offer races, ownership, privacy, rollback, seed and history. Twenty-one unit/HTTP tests cover the foundation, auth and sanitized transaction errors. Typecheck, lint and production build pass. Tests do not use Atlas or claim complete integration with #24/#25. No Atlas URI, local .env or Vercel project credentials were available. Candidate preview and Atlas validation remain pending coordinator access; #23 is not declared done and no self-approval, merge or deployment is performed.

### Course reflection

A transaction does not lock every document it reads. The implementation writes an internal guard on the same listing/copy before checking related requests so snapshot isolation cannot allow an incompatible concurrent request or publication. Real replica-set tests verify this behavior; simulated Maps alone cannot establish atomicity or index enforcement. The seed uses explicit invocation, hashes passwords and preserves existing accounts instead of resetting a database.

### Integration follow-up

A separate temporary worktree combined code head 1d6329a and requests head cce497b, preserving the upstream models and mounting all routers. Typecheck and 43 tests passed (25 unit/HTTP plus 18 real replica-set integration tests). This is compatibility evidence, not an actual merge or peer approval. The #26 preview returned 302 to Vercel SSO for root/health/listings/stats; the bot's Ready state is not an endpoint verification. Coordinator Atlas/preview checks and Daniel's review remain outstanding.

### Additional review requested by the account holder

A second audit reproduced an incorrect field name in validation errors: missing/null/non-object listing terms returned a body error even though the outer JSON object was valid. The parser now carries the nested field path, returning `terms:` or `terms.owner:` as appropriate; a regression test failed before this fix. Added coverage for every modality's terms and Reserved lifecycle gates, preservation of bcrypt cost/passwords on reseeding, and a real database validation failure midway through withdrawal. The latter proves that listing state, copy state, internal revision and Pending requests all roll back, while the HTTP error remains sanitized. The current task suite is 21 unit/HTTP tests plus 15 replica-set tests (36 total), with lint/typecheck/build passing. Preview/Atlas and independent review limitations still apply.

### Daniel's review follow-up (2026-11-09)

Daniel's GitHub Comment on cb6558c judged the code ready for approval and left three nonblocking suggestions; he requested Ready for review to register formal approval. Codex addressed all three in the same task branch: NFC-normalized input metadata, one bounded current-listing lookup per authorized library page, and mongodb-memory-server-core without the binary-download postinstall hook. Two regression tests first reproduced the decomposed-accent search issue and the per-copy query count, then passed after the fixes. The updated suite passes 38 tests (21 unit/HTTP and 17 replica-set), lint/typecheck/build. The updated head is sent back to Daniel for independent formal review; his earlier Comment is not presented as an approval of the new commit. Atlas/preview validation remains coordinator work, and no task closure, merge or production deployment is performed.

## Issue #24 — M3: Requests and favorites (2026-11-06)

### Prompt or task

Implement the Milestone 3 backend models and routes for requests and favorites (`models/Request.ts`, `models/Favorite.ts`, `routes/requests.ts`, `routes/favorites.ts`), mount them in `server/app.ts`, align `api-design.md` with the Milestone 3 scope cuts, and add automated verification in `tests/requests-favorites.test.ts` on branch `feat/m3-requests`.

### AI suggestions

- Implement `FavoriteModel` with embedded `BookMetadata` validation, an owner-plus-catalogId unique index (`{ owner: 1, "book.catalogId": 1 }`), and the `FAVORITE-01..03` routes (`GET /api/favorites`, `POST /api/favorites`, `DELETE /api/favorites/:id`).
- Implement `RequestModel` with embedded `offeredBookSnapshot`, `listingSummary`, `quotedModality`, `quotedTerms`, modality-specific term validation, and the three partial unique indexes from `api-design.md` §3.4 (one active request per requester and listing, one accepted request per listing, and one active offer per copy).
- Execute `REQUEST-01`, `REQUEST-04`, `REQUEST-05`, `REQUEST-06`, and `REQUEST-07` inside `mongoose.connection.transaction(async (session) => ...)` so request, listing, library copy, and competing request state updates commit atomically without custom retry wrappers or `If-Match` headers.
- Include the upstream contract modules (`models/Account.ts`, `server/auth.ts`, `models/LibraryBook.ts`, `models/Listing.ts`) in a separate commit so the branch builds, typechecks, and passes tests independently before #22 and #23 merge.

### Changes adopted

- Added `models/Favorite.ts`, `models/Request.ts`, `routes/favorites.ts`, `routes/requests.ts`, and mounted both routers in `server/app.ts` before `handleNotFound`.
- Updated `api-design.md` to version 5 to reflect the Milestone 3 scope cuts (no `If-Match` / `version` fields, no custom transaction retry runner, no `REQUEST-08` reconfirmation).
- Added `tests/requests-favorites.test.ts` covering Mongoose schema validation, partial unique indexes, `FAVORITE-01..03`, and the full `REQUEST-01..07` lifecycle for Loan, Exchange, competing request auto-rejection, reject, cancel, and completion.

### Human changes and review

Pending peer review on GitHub before merge to `main`.

### Tests and verification

- `npm run lint`: 0 errors and 0 warnings.
- `npm run typecheck`: 0 TypeScript errors.
- `npm run build`: production client bundle built cleanly.
- `npm test`: 15 of 15 tests passing (`tests/api.test.ts` and `tests/requests-favorites.test.ts`).

### Learning

Resolving reference IDs through a helper that handles both raw `ObjectId` values and populated subdocuments prevents subtle authorization mismatches when Mongoose documents are reused across lifecycle steps.

### Review follow-up on ef6b619 (2026-11-08)

Andrés requested changes on concurrency, dependency integration and evidence. Changes and status:

- **Concurrency (P1):** `REQUEST-01` now performs a conditional write inside the same transaction session: `Listing.updateOne({ _id, status: "Available" }, { $inc: { revision: 1 } })` and, for Exchange, `LibraryBook.updateOne({ _id, owner, status: "Available" }, { $inc: { revision: 1 } })`. `revision` is an internal field with `select: false`; it is not a DTO field and there is no `If-Match`. A concurrent committed write on the same document makes MongoDB abort the transaction with a write conflict, `mongoose.connection.transaction` re-runs the callback, and the retry reads the current state. The `revision` field on `models/Listing.ts` and `models/LibraryBook.ts` is a proposal that #23 and #25 must adopt in their own commands; names are still to be coordinated with Daniel and Andrés.
- **Real verification:** `tests/integration/requests-concurrency.spec.ts` (`npm run test:integration`) runs against an in-memory single-node replica set (`mongodb-memory-server`), with real transactions and real indexes. It covers: three partial unique indexes present and a real E11000 on a duplicate active request; request vs concurrent withdrawal (409, no request left); request vs concurrent term edit (retry quotes the new terms); Exchange offer vs concurrent publication of the offered copy (409, no request left); one offered copy for two concurrent Exchange requests (one 201, one 409); two requesters on one listing (both 201). Results on this machine: 6 of 6 passing. With the conditional writes removed, the three interleaving tests fail (201 instead of 409; 40000 instead of 55000), so they detect the reported bug.
- **What remains simulated:** `tests/requests-favorites.test.ts` still replaces `mongoose.connection.transaction` and the model methods with in-memory stubs. It checks response shapes and the sequential flow only, not transactions, rollback or indexes.
- **Not yet done:** real per-endpoint results against an isolated Atlas database and the Vercel preview, with date and head commit and no tokens. The `curl` blocks in the PR description are examples, not recorded runs, until that evidence is added. Issue #24 must stay open until then.
- **Dependencies (P2):** After PR #29 (`feat/m3-auth`, issue #22) merged into `main` (`015f7e9`), this branch was rebased onto `main` and dropped its provisional copies of `models/Account.ts` and `server/auth.ts`, using the merged modules from #22 directly. `models/Listing.ts` and `models/LibraryBook.ts` remain provisional copies (with the internal `revision` field) until #23 merges; the PR stays in draft until the reviewed #23 modules replace them.

### Review follow-up on cce497b (2026-11-08)

- **Integrated #23 models from PR #26 (`origin/feat/m3-listings`):** Replaced the provisional `models/LibraryBook.ts` and `models/Listing.ts` with the exact modules from PR #26 (`bb0809d`), along with `server/bookMetadata.ts` and `server/listingTerms.ts`. `models/Favorite.ts` and `models/Request.ts` now import shared metadata and term schemas from `server/bookMetadata.ts` and `server/listingTerms.ts`.
- **Tombstone filtering (`deletedAt: null`):** Added `deletedAt: null` to the conditional `LibraryBookModel.updateOne` guard in `REQUEST-01` (`routes/requests.ts`) and added an integration test in `tests/integration/requests-concurrency.spec.ts` verifying that soft-deleted copies (`deletedAt !== null`) are rejected (`404`) and concurrent soft-deletes abort `REQUEST-01` without leaving an orphan request.
- **Executed `curl` and index verification on the local replica set:** Added an integration test in `tests/integration/requests-concurrency.spec.ts` that runs `curl` against all ten operations (`FAVORITE-01..03`, `REQUEST-01..07`) and checks `FavoriteModel.collection.indexes()` and `RequestModel.collection.indexes()` against the local single-node MongoDB replica set (`8/8` passing in `npm run test:integration`, `24/24` passing in `npm test`).
- **Vercel preview and Atlas status:** The Vercel preview deployment (`https://thebridge-git-feat-m3-requests-the-bridge13.vercel.app`) builds Ready (`SUCCESS`), and `curl -I /api/health` returns HTTP `302` due to Vercel SSO protection. Verification against an isolated Atlas dataset and an authorized preview session remains pending coordinator access before #24 is closed.

### Review follow-up on e200aaa and integration of merged #26 (2026-11-08 / 2026-11-11)

- **Sequential transaction queries in `hydrateRequestDto` (P2):** Replaced `Promise.all` inside `hydrateRequestDto` (`routes/requests.ts`) with sequential `await` calls for `owner`, `requester`, and `listing` when hydrating inside `mongoose.connection.transaction(async (session) => ...)`, complying with the MongoDB driver restriction against parallel operations on the same `ClientSession` and `api-design.md` §1.
- **Merged `main` after PR #26 (`c34ee0f`):** Kept the reviewed `#23` modules (`a07173f` NFC metadata normalization, `mongodb-memory-server-core` dependency/lockfile, `seed` script, and all routers mounted in `server/app.ts`) and updated `tests/integration/requests-concurrency.spec.ts` to import `MongoMemoryReplSet` from `mongodb-memory-server-core`.
- **Verification:** Re-ran `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (`25/25` passing), and `npm run test:integration` (`25/25` passing across both replica-set suites: `50/50` total).
