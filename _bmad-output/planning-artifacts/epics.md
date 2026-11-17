---
status: delivered
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/architecture/architecture-TheBridge-2026-10-27/ARCHITECTURE-SPINE.md
  - api-design.md (contract version 4, PR #19 at 700e107)
  - openspec/specs/app-navigation/spec.md
  - openspec/changes/0-2-rubric-compliance (PR #17)
  - openspec/changes/0-3-data-layer-consolidation (PR #18)
  - Course READMEs HW11–HW15 (provided by Juan on 2026-10-30; not in the repository)
---

# TheBridge - Epic Breakdown

## Overview

This document provides the epic and story breakdown for TheBridge, decomposing the requirements from the PRD and Architecture into stories. The product was built issue by issue against `api-design.md` before this breakdown was closed, so each story below records the pull request that delivered it. Coverage follows each pull request's scope; end-to-end verification of every FR and NFR is tracked in issue #50.

## Requirements Inventory

### Functional Requirements

FR-1: A Visitor can register with a name, an email and a password; the Account is always a Member, a duplicate email is rejected with a message, a missing name, invalid email or password shorter than 8 characters is rejected per field, and the password is never stored or returned in readable form.
FR-2: A person can log in with email and password and log out; wrong credentials show one generic error, a Member lands on My Books and an Admin on the Admin Area, and after logout protected pages redirect to login.
FR-3: Pages and operations are restricted by Role: without a session My Books, Add Book, Create Listing and Requests redirect to login and every write is refused as unauthenticated; a Member cannot open the Admin Area or call admin operations (forbidden); an Admin does not see member navigation and cannot publish or send Requests.
FR-4: A session lasts 24 hours; an expired session on any page redirects to login with "Your session expired. Please log in again." and returns the person to the page they were on after logging in.
FR-5: A Visitor can search the Open Library Catalog (up to 20 results) with loading, success, saved-data, empty and error states; a query shorter than 3 characters shows "Use at least 3 characters." and does not search; saved results are shown with their time when Open Library is unreachable; a new search cancels the previous one.
FR-6: A Member can add and remove Catalog books as Favorites, stored with the Account so they appear on any device; a Visitor without a session is sent to login.
FR-7: A Member sees only their own Library Books with cover, title, author, Condition, status and activity; an empty library shows an empty state linking to Add Book; Transferred books are hidden from active books; filters and per-status counts keep working.
FR-8: A Member can add a Library Book from a Catalog result with a required Condition and optional notes; it starts Available.
FR-9: A Member can edit the Condition and notes of, or delete, an Available Library Book only; Published, Reserved and Lent books say why not; the Offered Book of a Pending Request cannot be edited, deleted, published or offered again until that Request is Rejected or Cancelled.
FR-10: A Member can publish an Available Library Book with a Modality and Terms (Loan: duration; Rental: price > 0 and duration; Sale: price > 0; Exchange: optional desired book); the server enforces the same rules; publishing sets the book Published and the Listing Available; Create Listing for a missing or unavailable book selects another and explains why.
FR-11: An Owner can change the Modality or Terms of an Available Listing; changing them marks every Pending Request as needing reconfirmation, which blocks acceptance until the Requester reconfirms or cancels; a non-Exchange Modality frees Offered Books; an Exchange Modality keeps them held until reconfirmation with the same or another book.
FR-12: An Owner can withdraw an Available Listing; the Library Book returns to Available and every Pending Request becomes Rejected.
FR-13: A Visitor can browse Available Listings only, search by title, author, genre or ISBN ignoring case and accents, filter by Modality, genre and Condition, and move between pages of 10.
FR-14: A Visitor can see the total of Available Listings, the count per Modality and the average Rental and Sale price, computed over all filtered matches before pagination.
FR-15: A Visitor can open a Listing and see the book, the Owner's real name, the Condition, the Modality and the Terms in plain words; an unknown or Removed Listing shows a not found page; a Marketplace quick view lets a Member send a Request under the FR-17 rules.
FR-16: A Visitor sees on Home four figures computed from Available Listings and the four newest Listings.
FR-17: A Member can send a Request on a Listing they do not own, choosing an Available Offered Book for Exchange; the button names the Modality; own or non-Available Listings and a second active Request on the same Listing are refused; a Visitor without a session goes to login and returns to the Listing.
FR-18: A Member sees Received and Sent Requests in separate tabs with counterpart, Listing, status and message; changes appear on open or refresh (no real time); a Request needing reconfirmation shows the Requester a Reconfirm action and tells the Owner it is waiting.
FR-19: An Owner can accept or reject a Pending Request; accepting reserves the Listing, rejects the other Pending Requests, sets the book Lent (Loan/Rental) or Reserved (Sale/Exchange, plus the Offered Book), and tells both people to meet in person; a Request needing reconfirmation can be rejected but not accepted.
FR-20: A Requester can cancel their own Pending Request; it stops blocking a new Request and frees its Offered Book.
FR-21: An Owner can complete an Accepted Request: Loan/Rental after the physical return (labeled as confirming the return), when the book returns to Available and the Listing becomes Closed, or stays Removed; Sale/Exchange after the handoff, when the Listing closes and the books become Transferred without moving between libraries.
FR-22: An Admin sees totals of Members, Listings by status and Requests by status.
FR-23: An Admin can list every Listing, Request and Member with search and pages; Listing rows show Owner name and email, Request rows show Requester, Owner and Listing; passwords are never shown.
FR-24: An Admin can remove a Listing that is not Closed or Removed with a required reason; it disappears for everyone; Pending Requests and an Accepted Sale/Exchange become Rejected and free their books; an Accepted Loan/Rental stays Accepted and Lent until completed; a repeated removal is refused and frees nothing; the Owner sees the reason in My Books.
FR-25: The navigation depends on the session: Home, Marketplace, About and Log in without one; Members add My Books and Requests; Admins see the Admin Area instead.
FR-26: A Visitor can switch light and dark themes, remembered on that device.
FR-27: A Visitor can read the About page (project flow, user stories, team).
FR-28: An unknown address shows a 404 page with a link Home, including on direct visits and reloads.

### NonFunctional Requirements

NFR-1: The whole product runs from one public Vercel URL returning HTTP 200, recorded in `deployment.txt`; ungraded if not deployed.
NFR-2: Lint passes with no errors on client and server on every pull request.
NFR-3: Every error response is `{ "error": string, "code": number }` with `code` equal to the HTTP status.
NFR-4: Invalid input returns 400 with a message naming the problem, never 500.
NFR-5: Missing or invalid sessions return 401, wrong Role 403, unknown resources 404.
NFR-6: Collection endpoints accept page and page size (default 10) and return the total count.
NFR-7: The API is documented in `api-design.md` before its code is written.
NFR-8: Passwords are stored only as salted hashes.
NFR-9: The session token carries the Account id and Role and expires.
NFR-10: The server accepts browser requests only from the client's domain.
NFR-11: Every input is validated and type-checked on the server before any database query.
NFR-12: User text is rendered as text, never as HTML.
NFR-13: No secret is in the repository; `.env.example` lists the variables.
NFR-14: The server sets security headers and rate-limits login and registration.
NFR-15: Shared entities (at least Listing, Request, Library Book, Account) are typed once for client and server, with strict checking and no `any`.
NFR-16: Components and hooks reach domain data, including the session token, only through `src/services/*`; the theme preference is the only other browser-storage use.
NFR-17: Code files contain no comments.
NFR-18: Visible text is in English.
NFR-19: Every page works from 360 px to desktop, keeps Milestone 2 accessibility, and shows loading, empty and error states for every server call.

### Additional Requirements

From the architecture, the spine and API contract version 4:

- No starter template: this is a brownfield React 19 + Vite client. The first backend work splits the existing `src/` into `client/src/` and adds `server/`, root `routes/`, `models/`, `api/index.js` and `vercel.json` in the layout of architecture §3, with one root package and lock.
- Graded files live at the literal rubric paths in the repository root: `api-design.md`, `routes/`, `models/`, `deployment.txt`, `.env.example`, `tsconfig.json`, `src/types.ts`, `security-audit.md`. Route and model files are the real implementation, not wrappers.
- One Vercel project serves the client at `/` and the API at `/api`; API rewrites come before the SPA fallback, and an `/api` miss returns JSON 404. Vite `base` moves from `/TheBridge/` to `/`, replacing GitHub Pages, in one approved change that also updates README and AGENTS deployment policy.
- Every weekly submission needs a verified public Vercel URL returning 200 in `deployment.txt`, passing lint, endpoint evidence and that week's `AI-LOG.md` answers. HW11 may serve an API-only response; HW13–HW15 serve the integrated client and API.
- Staged backend: HW11 in-memory Listing CRUD with a server-controlled demo owner and two fixture copies; HW12 MongoDB Atlas models, validation, index bootstrap, `populate()` owner projection and an explicit seed; HW13 real auth, Roles, Requests, Favorites, moderation and removal of runtime domain mocks; HW14 shared types; HW15 audit, shared rate limiter and final URL.
- Contract: 32 operations with stable IDs (AUTH-01–03, OPS-01, COPY-01–05, LISTING-01–07, REQUEST-01–08, FAVORITE-01–03, ADMIN-01–05); `{data}` and `{data, meta}` envelopes; pagination 1–100 with default 10; strong `If-Match` versions on mutations; 409 for conflicts and stale versions.
- Consistency: mutations run in bounded Atlas transactions (three body attempts, three commit calls, 503 on unknown commit outcome); active-state unique indexes for open listing, active member request, accepted winner and active offer; Pending offers keep the copy Available with a derived hold; quote snapshots change only on offer release by an edit or on REQUEST-08.
- Auth: JWT HS256 with `sub`, `role`, `iss`, `aud`, 24-hour TTL validated at startup; bcryptjs cost 12 with a dummy comparison for absent emails; token kept in `localStorage` through `authStorage` (residual XSS risk to be acknowledged by Juan and Jorge before the auth story); session generation guards against late responses after logout.
- Admin accounts exist only through the offline `server/scripts/bootstrap-admin` command; there is no promotion route.
- Express middleware order: correlation and log redaction, CORS allowlist from `CLIENT_ORIGINS`, Helmet, 32 KiB JSON parser, auth rate limiting, routes, API 404, central error handler; no stack traces or database messages in responses.
- Rate limiting on Vercel needs a shared store or a deployment-wide rule (Q-2); proposed 10 logins and 5 registrations per 15 minutes per client IP.
- HW14: strict `tsc --noEmit` plus a no-explicit-any lint check; at least three typed React components and two typed root route files; `@/types` alias for type-only imports.
- Client migration keeps the service boundary: each storage service becomes an API adapter; the quick view and cards are preserved; DTO adapters translate `coverUrl` to the client's `cover`.
- Coordinator gates: Q-2 (Vercel project, region, limiter store, real URLs) is needed before the first weekly submission; Q-3 (instructor's grading root and source collection) before each submission.
- Course detail (HW11 README): the rubric names GET/POST/PUT/DELETE as the correct methods, while LISTING-06 uses PATCH with a full replacement body. Any change belongs to the contract owner (Andrés) through a pull request to `architecture.md` and `api-design.md`.
- Existing Epic 0 work: 0.1 removed dead code (merged); 0.2 rubric compliance (PR #17) and 0.3 data-layer consolidation (PR #18) await spec approval and must merge before the `client/` split.

### UX Design Requirements

No UX design document exists. The Milestone 2 interface is the reference for every screen; stories that change UI state the visible behavior in their acceptance criteria and keep NFR-18 and NFR-19.

### FR Coverage Map

FR-1: Epic 2
FR-2: Epic 2
FR-3: Epic 2
FR-4: Epic 2
FR-5: Epic 0 (search rule), Epic 5 (Open Library catalog)
FR-6: Epic 3
FR-7: Epic 1
FR-8: Epic 1
FR-9: Epic 1
FR-10: Epic 1
FR-11: Epic 1
FR-12: Epic 1
FR-13: Epic 1
FR-14: Epic 1
FR-15: Epic 1
FR-16: Epic 1
FR-17: Epic 3
FR-18: Epic 3
FR-19: Epic 3
FR-20: Epic 3
FR-21: Epic 3
FR-22: Epic 4
FR-23: Epic 4
FR-24: Epic 4
FR-25: Epic 2
FR-26: Epic 0 (Milestone 2 base)
FR-27: Epic 0 (Milestone 2 base)
FR-28: Epic 0 (Milestone 2 base)
NFR-1, NFR-2, NFR-7, NFR-13: Epic 5
NFR-3 to NFR-6, NFR-9 to NFR-11, NFR-14: Epic 1, Epic 2
NFR-8: Epic 2
NFR-12, NFR-17, NFR-18: Epic 0, Epic 6
NFR-15: Epic 5
NFR-16: Epic 0, Epic 5
NFR-19: Epic 0, Epic 6

## Epic List

### Epic 0: Milestone 2 hardening

The Milestone 2 React client is clean, follows the rubric and shares one book shape and one search rule.

**Story 0.1 Remove dead code.** Delivered by #7.
**Story 0.2 Rubric compliance.** Spec #17; hero images and data moved out of components. New code since then pushed 17 files over 80 lines, handled by #46, #47 and #48.
**Story 0.3 Data layer consolidation.** Spec #18, scope trimmed by #42, delivered by #45 (issue #44): one catalog search rule and single book field names.

### Epic 1: Library books and listings

A Member manages a library and publishes listings in four modalities; a Visitor browses, filters and sees statistics.

**Story 1.1 API foundation for Vercel.** Delivered by #21.
**Story 1.2 Library books and listings.** Delivered by #26 (issue #23).

### Epic 2: Accounts and auth

People register, log in with a 24-hour session, are restricted by Role, recover and change passwords, and can delete their account.

**Story 2.1 Accounts and auth.** Delivered by #29 (issue #22).
**Story 2.2 Password recovery by email.** Delivered by #38 (issue #37).
**Story 2.3 Account management.** Delivered by #40 (issue #36).

### Epic 3: Requests and favorites

A Member sends, accepts, rejects, cancels and completes Requests, saves Favorites, and books move between libraries on completion.

**Story 3.1 Requests and favorites.** Delivered by #28 (issue #24).
**Story 3.2 Move books between libraries on completion.** Delivered by #34.
**Story 3.3 Payment method on sales.** Delivered by #39 (issue #35).

### Epic 4: Admin moderation

An Admin sees totals, lists Listings, Requests and Members, and removes Listings with a reason.

**Story 4.1 Admin API (ADMIN-01 to ADMIN-05).** Delivered by #30.
**Story 4.2 Admin area in the client.** Delivered by #32.

### Epic 5: Client migration, types and security

The client talks only to the API through services, shared types are strict, and the deployed product has a security audit.

**Story 5.1 Migrate the client to the API.** Delivered by #31 (issue #25).
**Story 5.2 Typed components and security audit (HW14, HW15).** Delivered by #27, updated by #33 and #43.

### Epic 6: Delivery follow-up

The remaining gaps against the rubric are closed and the final state is verified.

**Story 6.1 Split admin and library components.** Issue #46.
**Story 6.2 Split account, header, login and route table components.** Issue #47.
**Story 6.3 Split listing, requests and my-books components.** Issue #48.
**Story 6.4 Update the README to the real product.** Issue #49.
**Story 6.5 Final verification and AI-LOG record.** Issue #50, after 6.1 to 6.4.
