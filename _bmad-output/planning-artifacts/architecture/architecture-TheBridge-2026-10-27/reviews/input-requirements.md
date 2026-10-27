# Input reconciliation — requirements and course delivery

Date: 2026-10-27

Verdict: **Revise before architecture handoff.** The proposal covers the major capabilities and issue #9's architectural decisions, and it identifies product assumptions honestly. Two missing contracts would leave the Exchange experience and the HW11 CRUD delivery incomplete. Two smaller requirements need to survive into the implementation gates. This is an independent requirements reconciliation, not Juan/Jorge's approval, a code review, or a grading result.

## Inputs checked

- Current `architecture.md`, root `api-design.md`, and `ARCHITECTURE-SPINE.md` on `docs/architecture`.
- Draft PRD, product brief, and rubric addendum at the supplied temporary input directory; architecture identifies PR #13 commit `6f12ef9210f8ffa533fb0e21dd8ccc1deac6f275`.
- Original `hw11`–`hw15` README and root rubric files inside `C:/Users/andre/Downloads/OneDrive_1_12-10-2026.zip`.
- Issue #9's live task card, read through GitHub's public issue API: client/server layout; FR-linked listing/request/my-books contract; errors, storage, port, proxy, deployment; both named reviewers approve.
- Existing request card and request-storage behavior, used to check preservation of the Milestone 2 experience.

Line references below are to the reviewed draft. No application code or source planning artifact was changed by this review.

## Findings

### R-1 — High: the Exchange owner cannot inspect the offered book

**Locations:** `api-design.md:55` and `:140`–`:144`; personal-copy authorization at `:97` and `:102`.

**Requirement:** FR-17 makes an Exchange request carry the requester's offered physical book; FR-19 lets the listing owner decide whether to accept it. The product brief and PRD SM-3 preserve existing behaviors. Current `src/services/requestsStorage.js:51`–`:53` creates a note naming the offered title, and `src/components/requests/RequestCard.jsx` displays that note.

**Gap and impact:** The proposed Request DTO exposes only `offeredBookId`. Its `listing` summary describes the requested listing, not the offered copy. The listing owner cannot dereference the offered ID through COPY-02 because it is another member's private copy. No participant projection or other operation supplies its title. An adapter therefore cannot recreate the current Exchange note, and an owner would accept an unidentified offer or be forced to weaken private-library authorization.

**Requested correction:** Define a participant-only offered-book summary on Request, containing at least the copy ID and identifying metadata needed to evaluate the offer. Specify which condition/other fields are intentionally shared and how the summary survives deletion or later copy changes. Populate it server-side without exposing the requester's whole private library. Add an acceptance check where the listing owner reads the offer while COPY-02 for the same foreign copy still returns 404.

**Disposition:** Clear contract fix before Exchange implementation; it does not require adding a new product capability.

### R-2 — High: HW11 listing creation depends on a library fixture that is not defined

**Locations:** `api-design.md:114`, `:120`, `:172`–`:188`, `:226`; `architecture.md:211`–`:217`; spine AD-10.

**Requirement:** Original HW11 README and rubric require publicly usable full CRUD for the main entity in memory. The PRD week-11 row adopts listing CRUD.

**Gap and impact:** CreateListingInput requires an existing owned Available `libraryBookId`; the service must load that copy and change it to Published. HW11 explicitly includes only LISTING-01/04/05/06/07 and OPS-01. COPY-03 belongs to the remaining account-scoped operations introduced in HW13. The only staged fixture explicitly defined is an owner. A clean HW11 deployment can therefore have no valid POST listing input. Even an implicit single seeded copy would stop allowing new listing creation after publication unless its reuse/reset behavior is defined. The documented POST example uses an unexplained ID.

**Requested correction:** Define the minimal in-memory Account/LibraryBook fixture contract for HW11 alongside the owner fixture, including discoverable usable IDs and enough/replenishable copies for repeated CRUD verification. Alternatively, move the minimum copy-creation capability into HW11 under the same disposable identity. Keep the final ownership rules and final no-demo-fallback gate intact. Document a reproducible fresh-deployment create/read/update/delete sequence that does not require direct memory edits.

**Disposition:** Resolve the staged substrate before the HW11 implementation story; no permanent unauthenticated production mode is needed.

### R-3 — Medium: expiry detection is narrower than FR-4

**Location:** `architecture.md:166`; `api-design.md:90` delegates expiry behavior to this section.

**Requirement:** Draft PRD FR-4 says an expired session on **any page** redirects to login with `Your session expired. Please log in again.`, and login returns the person to their prior page. HW13 Layer 2 also asks for automatic expiry detection and redirect.

**Gap and impact:** The draft requires startup checks, protected-action checks, and monitoring while a **protected** view remains mounted. A signed-in person can remain on public Home, Marketplace, About, or listing details until the token expires without any stated expiry action. The expiry message is also absent from the architecture's stated behavior. This is a concrete divergence, not a demand to repeat all UI copy in the spine.

**Requested correction:** Give the app-level auth/session service responsibility for expiry while any route is mounted, and preserve the required message and safe return route. Include a downstream scenario where the person stays on a public listing past expiry without making an API call. If the product intends a different public-page experience, amend FR-4 before implementation instead.

**Disposition:** Clear wording and ownership fix; the existing safe relative-return-path rule should remain.

### R-4 — Medium: weekly submission gates are reduced to a final deployment

**Locations:** `architecture.md:209`–`:215`, `:262`–`:263`, `:267`–`:271`; `api-design.md:224`–`:228`.

**Requirement:** Every original HW11–HW15 README requires a public Vercel deployment and `deployment.txt` for that week's submission. Each also requires that week's `AI-LOG.md` answers. The addendum explicitly preserves both requirements every week.

**Gap and impact:** The stage table calls out a verified URL only for HW15. General deployment instructions and a later deployment story exist, but their dependency on the first HW11 submission is not stated; Q-2 leaves the Vercel account/project/origin to deployment/security stories. `AI-LOG.md` never appears in these deliverables or gates. A team following the stage table could finish HW11–HW14 features while postponing a mandatory public deployment or omitting the weekly log. This is a submission risk even when the backend design itself is correct.

**Requested correction:** Add one concise cross-week submission gate: public Vercel deployment and verified `deployment.txt`, the appropriate lint/typecheck evidence, and that week's AI-log answers. Make the initial hosting/project/origin setup precede the HW11 submission; leave final database, roles, and security checks in their proper later stages. Do not fabricate a URL or claim these checks already passed.

**Disposition:** Clear delivery sequencing fix; not a request to implement deployment in issue #9.

## Reserved moderation / Q-1 assessment

**The gate is honest and usable.** `architecture.md:156`, `:244`, `:261` and `api-design.md:168` explicitly identify the conflict: FR-24 permits removal of any non-Closed listing and release of its copy, whereas an accepted Loan/Rental has a Lent copy and an Accepted request. The proposed 409 for Reserved removal is labelled an exception and is expressly not claimed to satisfy the complete draft FR-24. The affected product owner and revisit point are named. The spine retains the gate.

This can remain open while the Express skeleton and Available-listing moderation proceed. The downstream moderation story must not declare FR-24 complete while the exception remains. Juan's chosen settlement must update the PRD, the canonical API contract, and the transition rules before the Reserved behavior is implemented. Do not silently replace the gate with a book-release implementation or invent cancellation/compensation semantics during coding.

## Coverage and bounded-scope assessment

| Input | Reconciliation result |
| --- | --- |
| Issue #9 | Client/server boundaries, canonical FR-linked HTTP operations, storage, ports, Vite proxy, deployment proposal, and two-human-review gate are present. DECISIONS records proposals as pending rather than agreed. |
| FR-1–FR-4 | Account creation, login, roles, hashing, token verification, logout, and safe return routes are represented. R-3 concerns the session-monitoring scope. |
| FR-5–FR-6 | Direct public Open Library search/cache and account-scoped favorites are preserved. Three-character searches and saved-data timestamps are explicit. |
| FR-7–FR-12 | Copy ownership, empty new libraries, terms, states, mutation guards, withdrawal, and proposed quote/history rules are represented. R-2 concerns the temporary HW11 dependency. |
| FR-13–FR-16 | Available-only search, filters, accent-insensitive matching, global filtered statistics, detail availability and newest listings are represented. |
| FR-17–FR-21 | Participant access, active-request uniqueness, guarded transitions, concurrency, completion and refresh behavior are represented. R-1 concerns offered-copy visibility. A-1/A-3/A-4 honestly require confirmation. |
| FR-22–FR-24 | Admin totals, search/pagination, safe email projections, removal reason retention and Available removal are covered. Reserved removal remains an explicit unresolved product conflict. |
| FR-25–FR-28 | Role navigation, existing theme/About, browser deep-link handling and unknown-page fallback are preserved. |
| NFR-1–NFR-7 | Single origin, lint, errors/statuses, pagination, validation and contract-first rules are covered. R-4 preserves the weekly deployment obligation. |
| NFR-8–NFR-14 | Salted hashing, JWT claims, exact origins, server validation, text rendering, secrets, Helmet and deployment-wide auth limits are covered. |
| NFR-15–NFR-19 | Shared root types, minimum typed components/routes, service access, no comments, English UI and accessibility/responsive/async feedback are traced. |
| Original course grading paths | Real root routes/models/types and required artifact paths are selected without duplicate facades. Directory-source reader limitations are explicitly flagged for instructor confirmation, not hidden behind an autograder claim. |
| Non-goals | No payment processing, chat, notifications, geolocation, multiple communities, extra roles, public Admin promotion, or automatic ownership transfer is introduced. Retained request summaries support the existing request UI rather than creating a separate public handoff-history feature. |

## Minor implementation carry-through notes

- **HW13 token storage:** The course README explicitly says `localStorage`; `authStorage` and bearer use are specified, but its precise persistence mechanism is not. Say that the token uses service-encapsulated localStorage so an implementer does not independently choose session-only memory. This is a small clarification, not a request to expose storage to components.
- **HW14 checks:** The original rubric says no `any` anywhere in authored code. The architecture narrows its explicit statement to migrated code. Preserve incremental migration, but require a project-wide check for explicit `any` and typed Express request bodies/responses in the two migrated routes. A passing build with `allowJs`/`checkJs: false` alone does not prove all these acceptance criteria.
- **NFR-19 verification:** Keep 360 px behavior, labels, keyboard use, dialog focus handling, and loading/empty/error states in the later OpenSpec acceptance criteria. Their traceability row is sufficient for this architecture; they need not become implementation detail in the spine.

## Handoff recommendation

Apply R-1–R-4 to the proposal and record the small token-storage/typecheck clarifications. Keep A-1–A-5 and Q-1–Q-3 visibly pending with their existing owners. Then send the concrete documents to Juan and Jorge; this reconciliation does not replace either required review and authorizes no code, push, pull request, or deployment.
