# Code input reconciliation

Date: 2026-10-27. Branch: `docs/architecture`. Lens: independent brownfield input reconciliation for the local `bmad-architecture` workflow. This is not `bmad-code-review`, a human approval, or permission to implement.

## Verdict

The proposed layered monolith is feasible for this repository. Its service boundary, physical-copy identity, asynchronous client migration, shared DTO owner, root server modules, and staged hosting transition fit the existing application. **Request contract corrections before independently implementing the affected features.** Two response omissions prevent a complete client from being built from the canonical contract alone; pagination also leaves an existing filter behavior without a defined replacement. These do not require abandoning the architecture or implementing server code in issue #9.

## Required corrections

### R1 — Exchange recipients cannot inspect the offered copy (priority 2)

**Locations:** `api-design.md:55`, `api-design.md:102`, `api-design.md:140`; architecture §4 Request storage.

`Request` returns an `offeredBookId`, but no offered-copy title, author, condition, or snapshot. `RequestListingSummary` describes the requested listing, not the offered copy. The listing owner cannot resolve the offer through COPY-02 because another Member's copy must return 404; an unlisted offered copy has no public listing to consult. The client therefore cannot tell the owner what they would accept in an Exchange. The existing received fixture in `src/data/requests.js` at least identifies the offered title in its note; the new DTO does not carry that note either.

**Requested correction:** define a participant-only offered-copy summary on Request, including a stable copy ID, safe book metadata, and condition. State whether this is an immutable request snapshot or a live projection, and retain it for participant history after tombstoning/transferring a copy. Keep unrelated private library fields inaccessible. Add this projection to shared DTO ownership and acceptance evidence. The owner must be able to display the offer using REQUEST-02/03 alone.

### R2 — Library activity vocabulary and publication projection are incomplete (priority 2)

**Locations:** `api-design.md:53`, `api-design.md:104`; architecture §7 client migration map.

LibraryBook's `activity.kind` has no allowed values or interpretation. The contract also supplies no current listing ID/modality when a copy is Published without requests: `activity` is then null. Existing `markBookPublished` stores both `listingId` and `listingModality` (`src/services/myBooksStorage.js:35–49`), and `MyBookStatusAction` displays the modality. A DTO adapter cannot recover a missing listing relation from COPY-01/02. Joining all pages of LISTING-03 is possible but would introduce an unspecified, potentially large client join; it is not the stated server-derived library projection.

**Requested correction:** define the exact activity discriminant, including incoming request versus outgoing exchange offer and how modality is available. Either add an explicit current-listing summary to LibraryBook or explicitly choose/document the joining strategy and loading behavior. Define which active request wins the singular projection when several Pending incoming requests exist; the current adapter ranks Accepted above Pending. This is a transport/data rule that separately built client and server units otherwise choose incompatibly.

### R3 — Paginated listing reads lose the genre filter's complete option set (priority 2)

**Locations:** `api-design.md:110–124`; architecture §7 listing migration.

`src/components/marketplace/ListingFilters.jsx:10–14` derives genre/condition options from the full unfiltered listing collection supplied by `useListingFilters`. LISTING-01 becomes paginated, while LISTING-02 returns counts and price averages only. Genre is an arbitrary bounded string rather than a fixed enum. A replacement that derives options from page 1 hides genres present only on other pages; deriving options from the filtered page also makes options disappear while filtering. Neither behavior preserves the current filter.

**Requested correction:** choose a canonical source for complete genre options, such as unpaginated distinct genres in an explicit facet projection or an approved fixed vocabulary. Define whether options follow the unfiltered Available dataset or the current filters. Condition options can use the fixed enum if this intentional change is stated. The UI result count should use collection `meta.total`, as opposed to the current page's array length. No new endpoint is prescribed by this review; the contract must select a bounded strategy.

### R4 — The verified existing React version does not match the lockfile (priority 2)

**Locations:** architecture §10 (`architecture.md:275`); spine Stack (`ARCHITECTURE-SPINE.md:111`).

Both describe React 19.2.8 as the existing verified version. `package.json` declares the range `^19.2.8`, but `package-lock.json:2621–2632` resolves React and React DOM to **19.3.0**. Direct parsing of the lockfile confirmed React Router DOM 6.30.6 and Vite 8.3.1, which agree with the proposal.

**Requested correction:** distinguish manifest ranges from installed lockfile versions. Record React/React DOM 19.3.0 as the current locked seed and preserve it unless a separately approved dependency change chooses otherwise. This is a documentation correction, not a request to change dependencies.

## Clarifications for downstream story planning

- **HW11 copy dependency:** the create-listing contract requires an authenticated owner's Available LibraryBook and atomically changes that copy to Published, but HW11 explicitly implements only listing CRUD/health and provides an owner fixture (`api-design.md:226`, architecture §7). Specify that HW11 also has a finite server-controlled in-memory copy fixture/repository, including its valid IDs and occupied-copy behavior, or another explicit disposable adaptation. This makes POST/withdraw runnable without inventing COPY endpoints or accepting client ownership. It need not block a transport-only skeleton.
- **Split tooling:** current `postbuild` executes `scripts/create-spa-fallback.js`, which hardcodes `dist/index.html` and `dist/404.html`. Moving build output to `client/dist` requires adapting that script before the hosting switch, or a split build fails after Vite succeeds. Current ESLint declares browser globals for every JS/JSX file and ignores only root `dist`; the split story must add server/Node and nested output handling, plus TypeScript parsing for HW14. These are bounded implementation tasks, not reasons to reject the layout.
- **Catalog identity:** `normalizeOpenLibraryBooks` exposes the external work key as `id`; `createLibraryBook` currently replaces it with a local physical ID and does not retain `catalogId`. The new adapter must preserve the external ID separately on first creation. Since the architecture explicitly prohibits silent browser-data import and new accounts start empty, missing IDs in old local copies are not an automatic migration blocker. A missing/non-work key needs a defined client validation response rather than a fabricated catalog ID.
- **Policy paths:** the split story should align AGENTS' literal `src/services/*` boundary with `client/src/services/*` through the team's reviewed-document process. The intended boundary is preserved by AD-1. The existing deployment policy remains binding until the separately approved hosting story changes it.

## Reconciled successfully

- **Client behavior:** the proposal correctly acknowledges that synchronous storage functions, event-driven refreshes, route lookup, publish handlers, and favorites will need asynchronous loading/error changes. It does not claim that swapping a repository alone preserves all call sites. Translating `coverUrl` to legacy `cover`, integer duration days to labels, nested metadata to flattened cards, safe member projections to display names, and canonical Lent to an explicitly updated view model is feasible. Current 7/10/14/21-day options match the proposed durations.
- **Identity and state:** separate catalog IDs and physical-copy IDs avoid the current timestamp/demo identity problem. Server ownership, accepted-winner indexes, active offered-copy exclusivity, immutable quote versions, conditional writes, and sequential session-bound transactions form a coherent target state machine. Pending offered-copy blocking agrees with `isBookFree` and derived request activity. Additional lifecycle rules are proposed product assumptions rather than falsely attributed existing server behavior.
- **Boundaries and types:** the real root `routes/` and `models/` paths can belong to the server while the frontend moves to `client/`. A root type-only DTO module avoids Mongoose/runtime coupling. `allowJs` with `checkJs: false` enables incremental migration but is not proof that remaining JS has strict type coverage; the document appropriately makes HW14 a later step. No Express, Mongoose, JWT, server deployment, or completed security audit is claimed to exist now.
- **Routing and branding:** current Vite base `/TheBridge/`, BrowserRouter `BASE_URL`, public asset prefixing, and coordinator-only deployment remain preserved until the hosting change. The Vercel proposal explicitly defers exact routing configuration to preview verification and requires API errors to precede SPA fallback. The protected logo/hero assets and CDN Tailwind convention need no change for this architecture.
- **Review and course gates:** the proposal retains Juan/Jorge approval, approved OpenSpec stories before code, explicit Admin bootstrapping, no automatic production seeding, no code comments, English documents, and no agent publishing. Reserved moderation is openly gated rather than claimed as implemented FR-24 compliance. Root grading paths are concrete modules, with evaluator collection explicitly left for instructor confirmation.

## Evidence and limits

Inspected the three proposed documents, AGENTS.md, current service/hook modules, representative pages/components and fixtures, package manifest/lock, Vite configuration, ESLint configuration, and SPA fallback script. Ran read-only Git status/fetch and direct lockfile parsing. No implementation, dependency installation, runtime change, build, deployment, publishing, or formal code-review workflow was performed. This report only writes the requested review artifact; it does not alter the proposed deliverables. External package/runtime research and exact course-rubric reconciliation are other review lenses; this report establishes local code consistency only.
