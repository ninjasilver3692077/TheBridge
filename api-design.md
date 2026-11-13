---
title: "TheBridge REST API contract"
status: proposed
version: 6
created: 2026-10-27
updated: 2026-11-13
issue: 37
input_prd_commit: 50edc11165184a186a5afb660a6ffb145feb1cb8
---

# TheBridge REST API contract

This is the canonical HTTP design for the Milestone 3 implementation. Version 5 applies the coordinator's scope cuts in issues #22–#25, including #23 (Library books and listings), before domain code. The full product requirements remain in the merged PRD; the narrower delivery profile below explicitly defers part of FR-11/FR-18/FR-19. Architecture and deployment boundaries are in [architecture.md](_bmad-output/planning-artifacts/architecture.md). This draft changes design only and does not claim implemented or deployed endpoints.

Version 5 keeps the existing operation paths and envelopes except REQUEST-08, which is deferred beyond Milestone 3. If-Match headers, entity version fields, quotedListingVersion, needsReconfirmation and a custom transaction retry runner are outside this delivery. An Available listing with any Pending request cannot be edited (409). Multi-document commands use mongoose.connection.transaction(async (session) => ...). These are the explicit delivery cuts in [#23](https://github.com/ninjasilver3692077/TheBridge/issues/23), shared by #22, #24 and #25; they do not claim that the complete PRD reconfirmation workflow has shipped.

Version 6 (issue #37, Milestone 4) adds AUTH-04 and AUTH-05 for password recovery by email. The existing operation paths and envelopes retain their Milestone 3 behavior. The recovery contract is specified below.

## 1. Global rules

Base path: `/api`. JSON request bodies require `Content-Type: application/json`; 32 KiB body limit. HTTPS is required in deployed environments. Dates are UTC ISO 8601 strings. Database IDs are 24-hex strings exposed as `id`; malformed IDs return 400 and well-formed unknown IDs return 404. Catalog IDs such as `/works/OL45804W` are separate strings, not database IDs.

One-resource successes are `{ "data": resource }`. Collections are `{ "data": [...], "meta": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 } }`. `total` counts the authorized, filtered collection before pagination; empty results return 200 with an empty array. `totalPages` is `ceil(total / limit)`. Delete/withdraw successes return 200 JSON, not an empty 204. Unknown fields/operators are refused rather than forwarded to database queries.

Every API error, including parser, auth, validation, origin-policy, rate-limit, method and fallback errors, has exactly this shape; `code` equals the HTTP status:

```json
{"error":"rentalPrice: enter a positive whole COP amount.","code":400}
```

| Status | Meaning |
| --- | --- |
| 400 | Missing/invalid field, malformed ID/JSON or invalid enum/query; message identifies the problem. |
| 401 | Missing, invalid or expired bearer token on a protected operation, or invalid login credentials; no token/password/database details. Public operations ignore bearer headers. |
| 403 | Valid token with forbidden role; wrong owner on a public listing mutation; disallowed browser Origin. |
| 404 | Unknown resource, Removed public listing, or another Member's private copy/request. |
| 405 | Unsupported method on a known API resource; send `Allow`. |
| 409 | Duplicate identity/active request, unavailable state/copy, blocked listing edit or confirmed write contention. |
| 413 / 415 | Body too large / unsupported request content type. |
| 429 | Auth rate limit exceeded; send `Retry-After`. |
| 500 / 503 | Sanitized unexpected fault / unavailable backing service or unconfirmed transaction commit. An unconfirmed commit is not a rollback guarantee. |

**Pagination:** every database collection endpoint accepts `page` (integer 1–10000, default 1) and `limit` (integer 1–100, default 10, following FR-13/NFR-6). Reject arrays, objects, operators and numeric fractions with 400. Pages beyond the end return an empty array with the actual total. Default sort is descending `createdAt`, then descending `id`, for deterministic ties. `q` is a trimmed string of at most 100 characters; server search ignores case/accents and escapes regex syntax. No arbitrary sort expressions are accepted.

**Concurrency:** mutations use server-side state/ownership checks and database transactions rather than client version preconditions. If-Match is not required and has no precondition semantics in this profile; entity DTOs have no version field. Unknown body fields, including submitted status/owner/version, remain validation errors. Reject an edit to an Available listing with Pending requests with 409 without changing its terms, requests or copies.

Multi-document changes use mongoose.connection.transaction(async (session) => ...) with all queries/writes in the same session and run sequentially. Conditional state updates and active-state unique indexes prevent double publication, duplicate active requests and double acceptance. A conditional internal revision write may serialize competing commands on a Listing or LibraryBook; it is server-only, never a DTO field or client precondition. Pending request creation must contend with editing/accepting/withdrawing/removing the same listing, and outgoing offers must contend with publishing/editing/deleting their physical copy. Transaction callbacks have no external side effects because the Mongoose helper may retry them.

No custom transaction-body or commit retry runner is implemented for Milestone 3. Use the Mongoose helper, finite database timeouts and sanitized conflict/unavailability errors. An uncertain commit outcome returns 503 without claiming rollback; clients refetch before further action and never automatically replay mutations.

**Roles:** Public operations ignore Authorization headers, including expired/malformed tokens, and expose the same public projection/status as anonymous requests under the usual validation/origin/rate-limit rules. This includes registration/login and health; their payload/readiness errors still apply. Member/Admin operations require `Authorization: Bearer <JWT>` and return 401 for invalid/expired tokens. All declared Member operations reject Admin with 403. `ownerId`, `requesterId`, removal actor and role are server-derived. Private reads are account scoped; public owner summaries contain name/id only. Admin member rows may contain email, never password/hash. Tokens and private data use `Cache-Control: no-store`. The client independently expires its active session on any page under FR-4.

## 2. Shared DTOs and payload vocabulary

Root `src/types.ts` will define these contracts once and both runtimes will import them. The following describes wire data, not an existing implementation:

| Type | Fields |
| --- | --- |
| Account | `id`, `name`, `email`, `role: Member/Admin`, `createdAt`, `updatedAt`. Only own-account/Admin projections include email. |
| PublicMember | `id`, `name`. |
| BookMetadata | `catalogId`, `title`, `author`, `genre`, `coverUrl`, `year`, `publisher`, `isbn`, `language`. `genre` defaults to `Uncategorized`; cover/year/publisher/isbn/language may be null; all response keys are present. |
| LibraryBook | id, book: BookMetadata, condition, notes, status, currentListing, activity, lastModeration, timestamps. currentListing is null or {id, modality, status} for an Available/Reserved listing. A Lent copy on a Removed listing has null currentListing but retains Accepted activity. Activity is null or {requestId, status, kind, counterpart: PublicMember}; kind is ReceivedRequest or OfferedExchange, status Pending or Accepted. lastModeration is null or {listingId, reason, removedAt}. |
| Listing | id, libraryBookId, owner: PublicMember, book, condition, description, modality, terms, status, closureReason, timestamps. Publication-time book/condition/description snapshots are immutable; closureReason is null, Withdrawn or Completed. No entity version field. |
| Request | id, listingId, owner: PublicMember, requester: PublicMember, listing: RequestListingSummary, offeredBookId, offeredBook, status, rejectionReason, quotedModality, quotedTerms, timestamps. offeredBookId/offeredBook are non-null for Exchange and null otherwise. offeredBook is an immutable {id, book: BookMetadata, condition} snapshot restricted to participants/Admin. Terminal requests retain snapshots but hold no copy. No version, quotedListingVersion or needsReconfirmation field. |
| RequestListingSummary | id, title, author, coverUrl, modality, status. Metadata and modality are request-time snapshots; modality equals quotedModality. Status is the current retained Listing status. |
| Favorite | `id`, `book: BookMetadata`, `createdAt`. Favorite ID is independent of catalogId. |
| AuthSession | `token`, `expiresAt`, `account: Account`. |

BookMetadata input requires nonempty `catalogId` (Open Library work key), `title` (1–300 characters) and `author` (1–200). Optional genre is 1–80 characters. Optional fields use the same nullability as responses. `year` is null or an integer 1–9999; ISBN is null or a normalized 10/13-character identifier; language is null or a three-letter code; publisher is null or 1–200 characters. Cover URL is null or HTTPS on `covers.openlibrary.org`. Metadata is an external snapshot, not proof of ownership; no user-provided URL is fetched by the server.

Condition is exactly `Like new`, `Good condition` or `Used copy`. Notes and moderation reason are plain text; notes max 2000 characters, reason trimmed 1–500. Name is trimmed 1–100 characters. Email is normalized and validated, max 254 characters. Password is at least eight characters and at most 72 UTF-8 bytes; it is never returned.

`terms` always contains `desiredBook`, `priceCop`, `durationDays`:

| Modality | desiredBook | priceCop | durationDays |
| --- | --- | --- | --- |
| Exchange | BookMetadata or null for Open to offers | null | null |
| Loan | null | null | 7, 10, 14 or 21 |
| Rental | null | Positive integer, max 1000000000 | 7, 10, 14 or 21 |
| Sale | null | Positive integer, max 1000000000 | null |

These validation boundaries use the existing BookMetadata and terms vocabulary. Reject inconsistent non-null terms with 400. Listing book/condition/description are snapshots of the physical copy at publication. Request creation captures the current listing summary, modality/terms and offered-copy summary; later metadata edits do not rewrite that quote. A listing with Pending requests cannot change terms; Reserved listings cannot be edited.

**Quote snapshots.** Request quotedModality, quotedTerms, listing metadata/modality and offered-copy snapshots are immutable after creation. Reconfirmation and REQUEST-08 are outside this delivery. Cancelling/rejecting/completing releases activity without erasing historical snapshots. A requester may send a new request only when no Pending/Accepted request on that listing exists and the listing is Available.

**Offer holds.** An offer held by a Pending request leaves its copy Available but blocks it through derived activity and the active-offer index (A-4). Reserved starts at acceptance. Release applies only to the reservation held by the transitioning request, never to a copy now committed elsewhere.

`Request.rejectionReason` is null unless status is Rejected. Rejected always has exactly one enum value: `OwnerRejected` (REQUEST-05), `CompetingRequestAccepted` (another request wins REQUEST-04), `ListingWithdrawn` (LISTING-07), or `ListingRemoved` (ADMIN-05, for Pending requests and for an Accepted Sale or Exchange request). Server commands set reason and status in the same transaction. This field is included in participant/Admin projections and does not contain the Admin's free-text moderation reason. It distinguishes status-message causes without exposing private moderation text. Non-Rejected states, including Cancelled, use null. There is no reconfirmation mutation in Milestone 3.

## 3. Operations

All paths below include `/api`. Each stable operation ID cites its requirement. Named inputs link to their payload rules below the corresponding table; shared BookMetadata/terms are defined in §2. All operations may return the applicable global errors; domain-specific cases are listed below.

### Accounts and operational readiness

| ID | Method and path | Access | Input | Success | Requirement |
| --- | --- | --- | --- | --- | --- |
| AUTH-01 | POST `/api/auth/register` | Public | [RegisterInput](#account-payloads) | 201 `data: AuthSession` | FR-1, FR-3 |
| AUTH-02 | POST `/api/auth/login` | Public | [LoginInput](#account-payloads) | 200 `data: AuthSession` | FR-2, FR-4 |
| AUTH-03 | GET `/api/auth/me` | Member or Admin | None | 200 `data: Account` | FR-2, FR-3, FR-25 |
| OPS-01 | GET `/api/health` | Public | None | 200 `data: {status: "ok"}` when configured/ready | FR-13 availability support; NFR-1 |

#### Account payloads

RegisterInput is `{name, email, password}`; role is always Member. Duplicate normalized email returns 409. LoginInput is `{email, password}`; wrong credentials return 401 with one generic message. AUTH-03 returns the authenticated account, not a user ID supplied by the client. OPS-01 returns a generic 503 error when required storage is unavailable and never publishes connection strings or runtime secrets.

For valid LoginInput with an absent email, perform one asynchronous comparison against a valid dummy bcrypt hash of the configured cost, then reject regardless of the comparison result. The dummy hash is prepared once per cost; no hash generation or early successful-login path is allowed on a missing Account. At auth startup validate the signing secret and a strictly parsed numeric TTL of 86400 seconds under architecture §5; pass the numeric TTL to `expiresIn`, never an unparsed environment string.

Logout is a client service operation clearing the token/private cache; there is no pretend server logout endpoint. Tokens otherwise remain valid until expiration. No refresh or public Admin creation/promotion endpoint is included. Only a protected-operation 401 matching the active generation/account invalidates the session. AUTH-02 invalid-credentials 401 remains a form error, not an expiry event. Expiry and safe post-login return behavior are specified in architecture §5.

### Milestone 4 password recovery (issue #37)

| ID | Method and path | Access | Input | Success | Requirement |
| --- | --- | --- | --- | --- | --- |
| AUTH-04 | POST /api/auth/forgot-password | Public | ForgotPasswordInput {email} | 200 data: PasswordResetResult {message} | FR-29 |
| AUTH-05 | POST /api/auth/reset-password | Public | ResetPasswordInput {token, newPassword} | 200 data: PasswordResetResult {message} | FR-29 |

For a valid normalized email, AUTH-04 always responds with the same message, "If an account matches that email, you will receive a password reset link.", whether the account exists or delivery fails. Invalid email/body fields return 400. Both recovery endpoints have independent limits of 10 requests per IP per 15 minutes, including invalid attempts, with the existing 429 envelope. Both send Cache-Control: no-store.

Reset tokens are 32 cryptographically random bytes, encoded as 64 lowercase hexadecimal characters. Only the SHA-256 digest and an expiry timestamp are stored on the Account, excluded from projections. They expire after one hour. Each new request replaces the previous link. A single conditional Account update consumes a matching, unexpired token, replaces the bcrypt password hash and clears the token fields atomically. Concurrent uses have exactly one winner. An invalid, expired, superseded, used or deleted-account token returns the same generic 400 message. A new password follows the registration rules, including the 72 UTF-8 byte maximum. Password validation errors do not consume the token. Existing Accounts need no backfill.

The server sends plain-text email using Resend's HTTPS API. RESEND_API_KEY and MAIL_FROM configure the sender. APP_URL is the trusted client base URL for the active deployment, including the preview URL when testing. HTTPS is required except for localhost development. Request headers never select the reset destination. The secret is carried in the link fragment at /reset-password#token=..., read into page memory and removed from the visible URL with history replacement. It reaches the API only in the reset POST body. Raw reset tokens, passwords, email provider responses and credentials are never logged or returned by the API. Delivery failure clears only the matching token, so an older failed send cannot clear a newer request.

Recovery is available for Member and Admin accounts without an active session. It does not automatically sign the person in. On success the current browser session is cleared and the page links to sign in. Existing JWTs held elsewhere remain valid until their normal expiry. Provider delivery timing may distinguish known emails even though status and payload are identical. The instance-local limiter has the serverless limitations recorded in security-audit.md. Real email delivery requires coordinator configuration and preview verification.

### Personal library

| ID | Method and path | Access | Input | Success | Requirement |
| --- | --- | --- | --- | --- | --- |
| COPY-01 | GET `/api/my-books` | Member | page, limit, optional status/q | 200 collection of LibraryBook | FR-7 |
| COPY-02 | GET `/api/my-books/:id` | Member, own copy | ID | 200 `data: LibraryBook` | FR-7, FR-10 |
| COPY-03 | POST `/api/my-books` | Member | [AddBookInput](#library-payloads-and-views) | 201 `data: LibraryBook` | FR-8 |
| COPY-04 | PATCH `/api/my-books/:id` | Member, own copy | [EditBookInput](#library-payloads-and-views) | 200 `data: LibraryBook` | FR-9 |
| COPY-05 | DELETE `/api/my-books/:id` | Member, own copy | None | 200 `data: {id, deleted: true}` | FR-9 |

#### Library payloads and views

AddBookInput is `{book: BookMetadata, condition, notes?}`; notes defaults to `""`. New books are Available. Two copies of the same Catalog work are allowed. EditBookInput contains condition and/or notes only, with at least one field. COPY-04/05 require Available and no active offered-book activity (A-4); otherwise 409. Historical references are retained: deletion is a tombstone where necessary, never a cascade deleting requests. Other Members' copies return 404.

COPY-01 defaults to active statuses, excluding Transferred; an explicit valid status filter can retrieve Transferred history. Activity comes from authorized requests, not client overrides: prefer an Accepted request, otherwise the newest Pending request by createdAt/id; counterpart is requester for ReceivedRequest and listing owner for OfferedExchange. currentListing supports the existing View Listing action without a second ownership lookup. A Removed listing's reason is visible only to its owner through `lastModeration`, including after the copy returns to Available. Valid statuses are those in architecture §4; unknown values return 400. Library filter counts can be obtained from each status query's meta.total, and Received/Sent tab counts from the corresponding direction queries; do not derive global counts from one page.

### Listings, search and statistics

| ID | Method and path | Access | Input | Success | Requirement |
| --- | --- | --- | --- | --- | --- |
| LISTING-01 | GET `/api/listings` | Public | page, limit, q, modality, genre, condition | 200 collection of Listing | FR-13, FR-16 |
| LISTING-02 | GET `/api/listings/stats` | Public | Same filters, without page/limit | 200 `data: ListingStats` | FR-14, FR-16 |
| LISTING-03 | GET `/api/listings/mine` | Member | page, limit, optional status/q | 200 collection of owned Listing | FR-11, FR-12, FR-24 |
| LISTING-04 | GET `/api/listings/:id` | Public | ID | 200 `data: Listing` | FR-15 |
| LISTING-05 | POST `/api/listings` | Member | [CreateListingInput](#listing-payloads-and-lifecycle) | 201 `data: Listing` | FR-10 |
| LISTING-06 | PATCH `/api/listings/:id` | Member, owner | [EditListingInput](#listing-payloads-and-lifecycle) | 200 `data: Listing` | FR-11 |
| LISTING-07 | DELETE `/api/listings/:id` | Member, owner | None | 200 `data: Listing` with status Closed | FR-12 |

Register literal routes `stats` and `mine` before `:id`. All public list results are Available. Detail can show Available, Reserved or Closed to explain availability; Removed and unknown return 404. `mine` may include Removed and returns an owner-only `moderation` projection `{reason, removedAt}` or null in addition to Listing. No public response includes that projection or owner email.

#### Listing payloads and lifecycle

CreateListingInput is {libraryBookId, modality, terms}. The server loads the Member's Available copy, verifies it has no active outgoing offer/open listing, creates the Available listing and marks the copy Published in one transaction. Missing/foreign copy returns 404; occupied copy/open listing returns 409. EditListingInput is the full replacement {modality, terms}; identity/owner/snapshots are immutable. Only Available listings can be edited or withdrawn. Editing while any Pending request exists returns 409 even if a replacement is identical; an unsuccessful edit has no effects. With no Pending requests, update modality/terms atomically. Requests are never flagged or re-quoted.

LISTING-07 is semantic withdrawal: it sets Closed/Withdrawn, releases the copy and rejects Pending requests atomically. A repeated or otherwise invalid state transition returns 409. Request participants still see retained summaries.

`ListingStats` is `{total, byModality, averageSalePriceCop, averageRentalPriceCop, facets}`. byModality has all four modality keys, each with an integer count. Empty average categories are null. Average price is rounded to whole COP; rental average summarizes posted rental amounts, not a normalized daily rate. Stats and list share the same normalized filters and available-only predicate; stats are over all filtered matches, never just the current page. `facets` is `{genres: string[], conditions: Condition[]}` with sorted distinct values across all Available listings, independent of the current filters/page, so Genre/Condition options do not disappear during filtering. Home uses the unfiltered stats and page 1 of newest listings with `limit=4`.

Allowed modality/condition query values are the corresponding enums; genre is a bounded plain string. Search covers title, author, genre and ISBN. Search-as-you-type cancels/debounces through the client service; pagination resets to page 1 after a filter change. Identical sort ties use descending ID. A stats request containing page/limit returns 400 to expose client mistakes.

### Requests

| ID | Method and path | Access | Input | Success | Requirement |
| --- | --- | --- | --- | --- | --- |
| REQUEST-01 | POST `/api/listings/:id/requests` | Member, not owner | [SendRequestInput](#request-payloads-and-transitions) | 201 `data: Request` | FR-17 |
| REQUEST-02 | GET `/api/requests` | Member | direction, page, limit, optional status/q | 200 collection of Request | FR-18 |
| REQUEST-03 | GET `/api/requests/:id` | Member, participant | ID | 200 `data: Request` | FR-18 |
| REQUEST-04 | PATCH `/api/requests/:id/accept` | Member, listing owner | Empty object | 200 `data: Request` Accepted | FR-19 |
| REQUEST-05 | PATCH `/api/requests/:id/reject` | Member, listing owner | Empty object | 200 `data: Request` Rejected | FR-19 |
| REQUEST-06 | PATCH `/api/requests/:id/cancel` | Member, requester | Empty object | 200 `data: Request` Cancelled | FR-20 |
| REQUEST-07 | PATCH `/api/requests/:id/complete` | Member, listing owner | Empty object | 200 `data: Request` Completed | FR-21 |

#### Request payloads and transitions

SendRequestInput is {offeredBookId} for Exchange and {} otherwise; missing Exchange offer or a non-null offer outside Exchange returns 400. Owner/requester come from the token/listing. Own listing returns 403; unavailable listing, duplicate active request or unavailable/occupied offer returns 409. Unknown/foreign offered copy returns 404. Pending/Accepted requests block a second request by that member on the listing; terminal requests do not, but the listing must still be Available.

`direction` is received or sent, default received. Requests are restricted to the token account, never an arbitrary account query parameter. q searches the authorized listing title/author and counterpart name only. Status filters use the Request status enum. Request summaries remain accessible after public listing removal/closure; a Member who is neither owner nor requester receives 404. No full public account/email projection is populated.

Only Pending requests can be accepted, rejected or cancelled. Only Accepted requests on Reserved listings can be completed, with the existing exception that a Loan/Rental on a Removed listing can still complete after physical return. Repeated/terminal/invalid-state transitions return 409. Accept updates the winner, listing, both affected copies and competing requests atomically. An edit cannot invalidate a Pending quote because the edit is blocked. Participants refetch after mutations.

A quick view uses REQUEST-01 with the same rules as the detail page (FR-15). There is no quick-view operation and no REQUEST-08 endpoint in Milestone 3.

### Favorites

| ID | Method and path | Access | Input | Success | Requirement |
| --- | --- | --- | --- | --- | --- |
| FAVORITE-01 | GET `/api/favorites` | Member | page, limit, optional q | 200 collection of Favorite | FR-6 |
| FAVORITE-02 | POST `/api/favorites` | Member | `{book: BookMetadata}` | 201 `data: Favorite` | FR-6 |
| FAVORITE-03 | DELETE `/api/favorites/:id` | Member, own favorite | ID | 200 `data: {id, deleted: true}` | FR-6 |

Saving the same catalogId twice returns 409; deleting a foreign/unknown favorite returns 404. Catalog searches remain a public direct Open Library service (FR-5), not a fake `/api/catalog` route. Normalize all three catalog entry points to the PRD's three-character minimum and propagate saved-data timestamps through service responses. Catalog caching is device-local and public; account favorites are server data. Logout clears rendered/private account state before another account is loaded.

### Admin moderation

| ID | Method and path | Access | Input | Success | Requirement |
| --- | --- | --- | --- | --- | --- |
| ADMIN-01 | GET `/api/admin/overview` | Admin | None | 200 `data: AdminOverview` | FR-22 |
| ADMIN-02 | GET `/api/admin/listings` | Admin | page, limit, q, optional status | 200 collection of AdminListing | FR-23 |
| ADMIN-03 | GET `/api/admin/requests` | Admin | page, limit, q, optional status | 200 collection of AdminRequest | FR-23 |
| ADMIN-04 | GET `/api/admin/members` | Admin | page, limit, optional q | 200 collection of MemberSummary | FR-23 |
| ADMIN-05 | DELETE `/api/admin/listings/:id` | Admin | `{reason}` | 200 `data: AdminListing` Removed | FR-24 |

AdminOverview is `{memberCount, listingsByStatus, requestsByStatus}` with every enum key present and nonnegative counts. MemberSummary is `{id, name, email, createdAt}` for role Member only. AdminListing extends Listing with owner email and moderation `{reason, removedAt, removedBy: {id, name}}` or null. AdminRequest extends Request with owner/requester emails. Password hashes and bearer tokens are never selected or serialized. q searches relevant title/name/email fields on these Admin-only collections, using safe bounded text search.

ADMIN-05 deliberately keeps DELETE with a JSON body. For an authenticated authorized Admin, a missing body/reason, non-string reason, whitespace-only reason or trimmed reason longer than 500 characters returns 400; do not silently discard the body or substitute an empty reason. A valid reason records the acting Admin. Closed returns 409; Removed returns 409 and changes nothing, so a repeated removal never overwrites the reason or frees a copy that belongs to a newer listing. Available and Reserved listings execute the atomic effects in architecture §4 (FR-24): Pending requests become Rejected with `ListingRemoved` and their Offered Books return to Available; an Accepted Sale or Exchange request becomes Rejected with `ListingRemoved` and its Library Book and Offered Book return to Available; an Accepted Loan or Rental request stays Accepted and its Library Book stays Lent until the owner completes the request after the physical return (REQUEST-07). A Lent copy cannot be published again until then. There are no account-edit/delete, role-change or arbitrary-request-edit Admin endpoints.

## 4. Examples and mutation preconditions

Publish a Loan from an owned Available copy:

```http
POST /api/listings
Authorization: Bearer <member-token>
Content-Type: application/json
```

```json
{
  "libraryBookId":"507f1f77bcf86cd799439011",
  "modality":"Loan",
  "terms":{"desiredBook":null,"priceCop":null,"durationDays":14}
}
```

Success is 201 with a complete Listing under data, including id, status Available, book metadata and the safe owner projection. Missing duration is 400; a Published copy is 409. Transactional state checks and a unique index protect creation; there is no If-Match requirement.

Send a non-Exchange request on an Available listing:

```http
POST /api/listings/507f1f77bcf86cd799439012/requests
Authorization: Bearer <member-token>
Content-Type: application/json
```

```json
{}
```

Accept a Pending request:

```http
PATCH /api/requests/507f1f77bcf86cd799439013/accept
Authorization: Bearer <owner-token>
Content-Type: application/json
```

```json
{}
```

If another action wins first, the losing action returns:

```json
{"error":"The request or listing changed. Refresh before trying again.","code":409}
```

The server rechecks ownership and lifecycle state in the transaction. Body-supplied owner/status fields are invalid. A lost response followed by a retry may return 409; the client refetches rather than assuming success or automatically repeating a mutation.

## 5. Rollout and verification ownership

HW11 implements LISTING-01/04/05/06/07 plus OPS-01 with in-memory storage, errors and pagination. Its disposable demo-only owner fixture is server controlled; the final role requirements above take effect with real auth in HW13. The in-memory repository starts with demo owner ID `507f1f77bcf86cd799439010` and two owned Available copies, `507f1f77bcf86cd799439011` and `507f1f77bcf86cd799439014`. The server's explicitly selected HW11 test fixture supplies these identities; clients can use the documented copy IDs for POST without a COPY-03 endpoint. Withdraw releases a fixture copy so the CRUD sequence can repeat. Fixtures contain no real account credentials and are removed from production runtime when persistence/auth are introduced.

HW12 replaces in-memory repositories with related Atlas models, validation and safe populate. An explicitly invoked seed creates the persisted demo Member/copies in the isolated grading database, using one-off operator credentials and the account hashing rules; the temporary server-owned demo-identity adapter targets that Member until HW13. It is not an in-memory fallback or an anonymous identity accepted from a body/header. HW13 removes that adapter, adds real account-scoped operations and removes production domain mocks. HW14 adds shared strict types; HW15 verifies security/deployment. Every weekly submission needs lint, verified endpoint/manual evidence, the week's AI-LOG answers and a real public Vercel URL returning 200. Authenticated production never falls back to demo identity or browser-local domain arrays.

This documentation is authored before API code. Contract tests in later approved stories must exercise the status matrix, auth/ownership, term validation, unfiltered/filtered totals, state conflicts and transaction races. Required tests are enumerated in architecture §9. Juan and Jorge review contract changes before implementation; the coordinator records real URLs only after deployment. No weekly grader pass or production check is asserted by this proposal.
