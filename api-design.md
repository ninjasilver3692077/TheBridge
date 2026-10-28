---
title: "TheBridge REST API contract"
status: proposed
version: 2
created: 2026-10-27
updated: 2026-10-28
issue: 9
input_prd_commit: e8545a29e7a4502a282f06f21c044de1e0b5cd79
---

# TheBridge REST API contract

This is the canonical HTTP design required before HW11 implementation. It is a proposal for Juan/Jorge review, reconciled with PR #13 at the input commit above. That PR is ready for review but remains unmerged and has no recorded human approval. Architecture, staged rollout, decisions A-1–A-5 and product gates Q-1–Q-3 are defined in [architecture.md](_bmad-output/planning-artifacts/architecture.md). No endpoint is claimed to exist yet.

## 1. Global rules

Base path: `/api`. JSON request bodies require `Content-Type: application/json`; 32 KiB body limit. HTTPS is required in deployed environments. Dates are UTC ISO 8601 strings. Database IDs are 24-hex strings exposed as `id`; malformed IDs return 400 and well-formed unknown IDs return 404. Catalog IDs such as `/works/OL45804W` are separate strings, not database IDs.

One-resource successes are `{ "data": resource }`. Collections are `{ "data": [...], "meta": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 } }`. `total` counts the authorized, filtered collection before pagination; empty results return 200 with an empty array. `totalPages` is `ceil(total / limit)`. Delete/withdraw successes return 200 JSON, not an empty 204. Unknown fields/operators are refused rather than forwarded to database queries.

Every API error, including parser, auth, validation, origin-policy, rate-limit, method and fallback errors, has exactly this shape; `code` equals the HTTP status:

```json
{"error":"rentalPrice: enter a positive whole COP amount.","code":400}
```

| Status | Meaning |
| --- | --- |
| 400 | Missing/invalid field, malformed ID/JSON, invalid enum/query/version header; message identifies the problem. |
| 401 | Missing, invalid or expired bearer token; no token/password/database details. |
| 403 | Valid token with forbidden role; wrong owner on a public listing mutation; disallowed browser Origin. |
| 404 | Unknown resource, Removed public listing, or another Member's private copy/request. |
| 405 | Unsupported method on a known API resource; send `Allow`. |
| 409 | Duplicate identity/active request, unavailable state/copy, stale version/quote or a conflicting transaction outcome. |
| 413 / 415 | Body too large / unsupported request content type. |
| 429 | Auth rate limit exceeded; send `Retry-After`. |
| 500 / 503 | Sanitized unexpected fault / unavailable backing service. |

**Pagination:** every database collection endpoint accepts `page` (integer 1–10000, default 1) and `limit` (integer 1–100, default 10, following FR-13/NFR-6). Reject arrays, objects, operators and numeric fractions with 400. Pages beyond the end return an empty array with the actual total. Default sort is descending `createdAt`, then descending `id`, for deterministic ties. `q` is a trimmed string of at most 100 characters; server search ignores case/accents and escapes regex syntax. No arbitrary sort expressions are accepted.

**Concurrency:** mutable resources expose `version`, initially 1. PATCH/DELETE on an existing copy/listing/request and POST Request creation require a strong `If-Match` header such as `"3"`; it refers to the target copy/listing/request version, or to the listing version for POST Request. Missing/malformed headers return 400; a valid but stale version returns 409. The server increments public versions on representation changes; body-supplied versions/status/owner fields are rejected. GET collections return versions so controls can send this header. All Pending creation and lifecycle commands also write one internal Listing revision in the same transaction; it is not returned and does not invalidate quotes when only a Pending request is inserted.

**Roles:** Public needs no bearer token; Member/Admin require `Authorization: Bearer <JWT>`. All declared Member operations reject Admin with 403. `ownerId`, `requesterId`, removal actor and role are server-derived. Private reads are account scoped; public owner summaries contain name/id only. Admin member rows may contain email, never password/hash. Tokens and private data use `Cache-Control: no-store`.

## 2. Shared DTOs and payload vocabulary

Root `src/types.ts` will define these contracts once and both runtimes will import them. The following describes wire data, not an existing implementation:

| Type | Fields |
| --- | --- |
| Account | `id`, `name`, `email`, `role: Member/Admin`, `createdAt`, `updatedAt`. Only own-account/Admin projections include email. |
| PublicMember | `id`, `name`. |
| BookMetadata | `catalogId`, `title`, `author`, `genre`, `coverUrl`, `year`, `publisher`, `isbn`, `language`. `genre` defaults to `Uncategorized`; cover/year/publisher/isbn/language may be null; all response keys are present. |
| LibraryBook | `id`, `book: BookMetadata`, `condition`, `notes`, `status`, `currentListing`, `activity`, `lastModeration`, `version`, timestamps. currentListing is null or `{id, modality, status, version}` for its Available/Reserved listing. Activity is null or `{requestId, status, kind, counterpart: PublicMember}`; kind is ReceivedRequest or OfferedExchange, and status is Pending or Accepted. lastModeration is null or `{listingId, reason, removedAt}`. |
| Listing | `id`, `libraryBookId`, `owner: PublicMember`, `book`, `condition`, `description`, `modality`, `terms`, `status`, `closureReason`, `version`, timestamps. book/condition/description are publication-time snapshots; closureReason is null, Withdrawn or Completed. |
| Request | `id`, `listingId`, `owner: PublicMember`, `requester: PublicMember`, `listing: RequestListingSummary`, `offeredBookId`, `offeredBook`, `status`, `quotedListingVersion`, `quotedModality`, `quotedTerms`, `version`, timestamps. offeredBookId/offeredBook are null exactly when quotedModality is not Exchange, regardless of later listing edits; offeredBook is an immutable `{id, book: BookMetadata, condition}` snapshot visible only to the participants/Admin. |
| RequestListingSummary | `id`, `title`, `author`, `coverUrl`, `modality`, `status`. Metadata/modality are immutable request-time snapshots, with modality equal to quotedModality; status is the current retained Listing status. |
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

These limits are proposed validation boundaries; Juan/Jorge confirm them with the PRD. Reject inconsistent non-null terms with 400. A Listing's book/condition/description snapshot is captured from its LibraryBook at publication and survives later copy edits or deletion; description captures notes at that time. Terms updates never accept arbitrary book/owner/condition replacements. Request creation captures the visible listing metadata, modality/terms, public version and offered-copy summary; later listing/copy edits never rewrite that quote.

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

Logout is a client service operation clearing the token/private cache; there is no pretend server logout endpoint. Tokens otherwise remain valid until expiration. No refresh or public Admin creation/promotion endpoint is included. Expiry and safe post-login return behavior are specified in architecture §5.

### Personal library

| ID | Method and path | Access | Input | Success | Requirement |
| --- | --- | --- | --- | --- | --- |
| COPY-01 | GET `/api/my-books` | Member | page, limit, optional status/q | 200 collection of LibraryBook | FR-7 |
| COPY-02 | GET `/api/my-books/:id` | Member, own copy | ID | 200 `data: LibraryBook` | FR-7, FR-10 |
| COPY-03 | POST `/api/my-books` | Member | [AddBookInput](#library-payloads-and-views) | 201 `data: LibraryBook` | FR-8 |
| COPY-04 | PATCH `/api/my-books/:id` | Member, own copy | [EditBookInput](#library-payloads-and-views), If-Match | 200 `data: LibraryBook` | FR-9 |
| COPY-05 | DELETE `/api/my-books/:id` | Member, own copy | If-Match | 200 `data: {id, deleted: true}` | FR-9 |

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
| LISTING-06 | PATCH `/api/listings/:id` | Member, owner | [EditListingInput](#listing-payloads-and-lifecycle), If-Match | 200 `data: Listing` | FR-11 |
| LISTING-07 | DELETE `/api/listings/:id` | Member, owner | If-Match | 200 `data: Listing` with status Closed | FR-12 |

Register literal routes `stats` and `mine` before `:id`. All public list results are Available. Detail can show Available, Reserved or Closed to explain availability; Removed and unknown return 404. `mine` may include Removed and returns an owner-only `moderation` projection `{reason, removedAt}` or null in addition to Listing. No public response includes that projection or owner email.

#### Listing payloads and lifecycle

CreateListingInput is `{libraryBookId, modality, terms}`. Server loads the authenticated Member's Available copy, atomically checks active/open relationships, creates the listing and marks the copy Published. Missing/foreign copy returns 404; occupied copy/open listing returns 409. EditListingInput is the full replacement `{modality, terms}` even though the method is PATCH; book identity/owner are immutable. Only Available listings can be edited/withdrawn. Pending requests retain their quoted terms and remain Pending after edit; accepting a stale quote conflicts under A-3.

LISTING-07 is semantic withdrawal: it sets Closed/Withdrawn, releases the copy and rejects Pending requests atomically. A repeated or otherwise invalid state transition returns 409. Request participants still see retained summaries.

`ListingStats` is `{total, byModality, averageSalePriceCop, averageRentalPriceCop, facets}`. byModality has all four modality keys, each with an integer count. Empty average categories are null. Average price is rounded to whole COP; rental average summarizes posted rental amounts, not a normalized daily rate. Stats and list share the same normalized filters and available-only predicate; stats are over all filtered matches, never just the current page. `facets` is `{genres: string[], conditions: Condition[]}` with sorted distinct values across all Available listings, independent of the current filters/page, so Genre/Condition options do not disappear during filtering. Home uses the unfiltered stats and page 1 of newest listings with `limit=4`.

Allowed modality/condition query values are the corresponding enums; genre is a bounded plain string. Search covers title, author, genre and ISBN. Search-as-you-type cancels/debounces through the client service; pagination resets to page 1 after a filter change. Identical sort ties use descending ID. A stats request containing page/limit returns 400 to expose client mistakes.

### Requests

| ID | Method and path | Access | Input | Success | Requirement |
| --- | --- | --- | --- | --- | --- |
| REQUEST-01 | POST `/api/listings/:id/requests` | Member, not owner | [SendRequestInput](#request-payloads-and-transitions), listing If-Match | 201 `data: Request` | FR-17 |
| REQUEST-02 | GET `/api/requests` | Member | direction, page, limit, optional status/q | 200 collection of Request | FR-18 |
| REQUEST-03 | GET `/api/requests/:id` | Member, participant | ID | 200 `data: Request` | FR-18 |
| REQUEST-04 | PATCH `/api/requests/:id/accept` | Member, listing owner | Empty object, request If-Match | 200 `data: Request` Accepted | FR-19 |
| REQUEST-05 | PATCH `/api/requests/:id/reject` | Member, listing owner | Empty object, request If-Match | 200 `data: Request` Rejected | FR-19 |
| REQUEST-06 | PATCH `/api/requests/:id/cancel` | Member, requester | Empty object, request If-Match | 200 `data: Request` Cancelled | FR-20 |
| REQUEST-07 | PATCH `/api/requests/:id/complete` | Member, listing owner | Empty object, request If-Match | 200 `data: Request` Completed | FR-21 |

#### Request payloads and transitions

SendRequestInput is `{offeredBookId}` for Exchange and `{}` otherwise; missing Exchange offer returns 400. Non-null offer outside Exchange returns 400. Requester/owner derive from the token/listing. Own listing returns 403; unavailable listing, duplicate active request, unavailable/occupied offer or stale listing version returns 409. An unknown/foreign offered copy returns 404. Pending/Accepted requests block another request by that member on the same listing; Rejected/Cancelled/Completed do not, although the listing must still be Available.

`direction` is received or sent, default received. Requests are restricted to the token account, never an arbitrary account query parameter. q searches the authorized listing title/author and counterpart name only. Status filters use the Request status enum. Request summaries remain accessible after public listing removal/closure; a Member who is neither owner nor requester receives 404. No full public account/email projection is populated.

Only Pending requests can be accepted, rejected or cancelled. Only Accepted requests on Reserved listings can be completed. Repeated, stale or terminal transitions return 409; no generic arbitrary-status update route exists. Accept is one transaction for the winner, listing, copy, offered copy and competitors. Read the state effects and A-1/A-3/A-4 in architecture §4/§8; client tabs refresh after successful mutations rather than guessing those effects.

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
| ADMIN-05 | DELETE `/api/admin/listings/:id` | Admin | `{reason}`, If-Match | 200 `data: AdminListing` Removed | FR-24, with Q-1 gate |

AdminOverview is `{memberCount, listingsByStatus, requestsByStatus}` with every enum key present and nonnegative counts. MemberSummary is `{id, name, email, createdAt}` for role Member only. AdminListing extends Listing with owner email and moderation `{reason, removedAt, removedBy: {id, name}}` or null. AdminRequest extends Request with owner/requester emails. Password hashes and bearer tokens are never selected or serialized. q searches relevant title/name/email fields on these Admin-only collections, using safe bounded text search.

ADMIN-05 requires a reason and records the acting Admin. Closed returns 409; Removed returns 409 (no reason overwrite or copy release from a newer listing); Available removal executes the atomic effects in architecture. **Reserved removal is deliberately gated by unresolved PRD Q-1:** proposed temporary behavior is 409 with `"Reserved listing moderation requires an agreed settlement policy."` FR-24 now explicitly rejects Accepted requests and releases their copies, but this does not establish physical return of a Lent book. The exception does not fully implement FR-24. Juan's product clarification must amend this contract before implementing Reserved moderation. There are no account-edit/delete, role-change or arbitrary-request-edit Admin endpoints.

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

Success is 201 with a complete Listing under `data`, including `id`, `version: 1`, `status: "Available"`, book metadata and safe owner projection. Missing duration is 400; a Published copy is 409. POST listing creation uses a transaction/unique index, not an If-Match precondition on a nonexistent listing.

Send a non-Exchange request on listing version 1:

```http
POST /api/listings/507f1f77bcf86cd799439012/requests
Authorization: Bearer <member-token>
If-Match: "1"
Content-Type: application/json
```

```json
{}
```

Accept request version 1:

```http
PATCH /api/requests/507f1f77bcf86cd799439013/accept
Authorization: Bearer <owner-token>
If-Match: "1"
Content-Type: application/json
```

```json
{}
```

If another action wins first, the losing action returns:

```json
{"error":"The request or listing changed. Refresh before trying again.","code":409}
```

Both request version and the stored quoted listing version/state are checked. Body-supplied owner or status is a validation error. A lost response followed by a retry may return 409; the client re-fetches and reconciles state instead of creating a duplicate or declaring success without evidence.

## 5. Rollout and verification ownership

HW11 implements LISTING-01/04/05/06/07 plus OPS-01 with in-memory storage, errors and pagination. Its disposable demo-only owner fixture is server controlled; the final role requirements above take effect with real auth in HW13. The in-memory repository starts with demo owner ID `507f1f77bcf86cd799439010` and two owned Available copies, `507f1f77bcf86cd799439011` and `507f1f77bcf86cd799439014`. The server's explicitly selected HW11 test fixture supplies these identities; clients can use the documented copy IDs for POST without a COPY-03 endpoint. Withdraw releases a fixture copy so the CRUD sequence can repeat. Fixtures contain no real account credentials and are removed from production runtime when persistence/auth are introduced.

HW12 replaces in-memory repositories with related Atlas models, validation and safe populate. An explicitly invoked seed creates the persisted demo Member/copies in the isolated grading database, using one-off operator credentials and the account hashing rules; the temporary server-owned demo-identity adapter targets that Member until HW13. It is not an in-memory fallback or an anonymous identity accepted from a body/header. HW13 removes that adapter, adds real account-scoped operations and removes production domain mocks. HW14 adds shared strict types; HW15 verifies security/deployment. Every weekly submission needs lint, verified endpoint/manual evidence, the week's AI-LOG answers and a real public Vercel URL returning 200. Authenticated production never falls back to demo identity or browser-local domain arrays.

This documentation is authored before API code. Contract tests in later approved stories must exercise the status matrix, auth/ownership, term validation, unfiltered/filtered totals, version conflicts and transaction races. Required tests are enumerated in architecture §9. Juan and Jorge review contract changes before implementation; the coordinator records real URLs only after deployment. No weekly grader pass or production check is asserted by this proposal.
