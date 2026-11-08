# M3 library and listings

Issue #23 implements COPY-01..05 and LISTING-01..07 against API design version 5. Authentication comes from merged #22/#29. Client service migration remains #25; these endpoints do not change the current client storage implementation.

## Runtime and seed

Set `MONGODB_URI` to an isolated MongoDB replica set or Atlas database and configure the existing auth variables from `.env.example`. Multi-document mutations require transaction support; a standalone MongoDB server is insufficient. No credentials or in-memory domain fallback are included in the application.

For an explicit demo seed, set `SEED_PASSWORD` in the ignored `.env`, then run `npm run seed`. It creates three Member accounts (`demo1`, `demo2`, `demo3` at `thebridge.example.invalid`) and four listings covering Exchange, Loan, Rental and Sale. Passwords use the existing bcrypt cost 12 helper. Rerunning preserves existing accounts/passwords and books, never promotes accounts and never clears collections. An occupied demo email with a different name or role fails instead of taking over that account. Each new copy/listing pair is created in one transaction.

## Shared model and concurrency contract for #24/#25

- `models/LibraryBook.ts` exports `LibraryBookModel`/`LibraryBook`, `LibraryBookDocument`, `StoredModerationNote` and `LIBRARY_BOOK_STATUSES`.
- `models/Listing.ts` exports `ListingModel`/`Listing`, `ListingDocument`, `StoredListingModeration` and `CLOSURE_REASONS`.
- Field names and collection references retain the provisional #28 contract: `owner`, `libraryBook`, `book`, `condition`, `notes`/`description`, `status`, `terms`, `closureReason`, `moderation`/`lastModeration`, timestamps and internal `revision`.
- Book metadata and term schemas live in `server/bookMetadata.ts` and `server/listingTerms.ts`, so these models do not import the downstream Favorite or Request models. #28 may reuse these exports when integrating; keep the reviewed model files from #23 instead of restoring provisional copies.
- Pending creation must write to the Listing and offered LibraryBook in the same session, as implemented by #28's conditional `$inc: {revision: 1}`. Publication, copy edit/delete, listing edit and withdrawal here perform conditional revision writes before checking active requests. The same-document write conflict forces a competing transaction to retry against current state. No public version, If-Match header, reconfirmation or custom retry runner is added.
- COPY deletion sets an internal `deletedAt` tombstone. LibraryBook `find`, `findOne` (including `findById`) and `countDocuments` exclude tombstones automatically. Raw collection operations, aggregates or future commands must explicitly exclude deleted records. Historical requests and their snapshots are never deleted.
- `server/requestLinks.ts` accesses the existing `requests` collection inside the transaction without defining a second Request model. Active offers block copy edit/delete/publication. Pending requests block even identical term edits. Withdrawal rejects Pending requests with `ListingWithdrawn`, closes the listing and releases its copy together.
- Private copy DTOs include `currentListing`, nullable activity and lastModeration. Activity remains null under the task's M3 allowance. Public Listing DTOs expose only owner id/name, never owner email, password hash, moderation or internal revision.

## Verification

`npm run test:integration` runs against a disposable real single-node MongoDB replica set using `mongodb-memory-server`. It exercises all twelve operations over HTTP, including an explicit `curl` sequence; ownership/role boundaries; validation; full filtered totals and global facets; snapshots; soft deletion/history; Pending/offer conflicts; atomic withdrawal; concurrent publication; concurrent requests/offers using the shared write protocol; and idempotent seed behavior.

`npm test` retains foundation/auth tests and checks sanitized 409/503 transaction failures, including an uncertain commit that instructs refetching rather than claiming rollback. `npm run lint`, `npm run typecheck` and `npm run build` are the remaining local checks.

The following actual `curl` sequence passed on November 8, 2026 against the local HTTP server and disposable replica set. IDs below are placeholders for the copy/listing returned earlier in the same sequence. The test does not print authorization headers or tokens.

| Operation | Method and path | Observed status |
| --- | --- | --- |
| COPY-03 | POST `/api/my-books` | 201 |
| COPY-01 | GET `/api/my-books` | 200 |
| COPY-02 | GET `/api/my-books/:id` | 200 |
| COPY-04 | PATCH `/api/my-books/:id` | 200 |
| LISTING-05 | POST `/api/listings` | 201 |
| LISTING-01 | GET `/api/listings` | 200 |
| LISTING-02 | GET `/api/listings/stats` | 200 |
| LISTING-03 | GET `/api/listings/mine` | 200 |
| LISTING-04 | GET `/api/listings/:id` | 200 |
| LISTING-06 | PATCH `/api/listings/:id` | 200 |
| LISTING-07 | DELETE `/api/listings/:id` | 200 |
| COPY-05 | DELETE `/api/my-books/:id` | 200 |

The local replica set is genuine MongoDB with real transactions; it is not evidence of Atlas permissions, production configuration, the Vercel preview or complete integration with #24/#25. No `.env`, Atlas URI or Vercel project credentials were available during implementation. Coordinator verification on the candidate preview remains required before #23 is marked done.

## Cross-branch verification and preview access

An isolated validation worktree combined code head `1d6329a` with #28 head `cce497b`. Keeping the #23 LibraryBook/Listing models and all domain routers, typecheck passed, as did 25 unit/HTTP tests and 18 real replica-set integration tests (43 total). This includes #28's six concurrency/index cases running with the actual upstream models. This was a temporary validation combination, not a merge into main or this task's branch. The expected conflicts were models, app composition, package scripts and AI-LOG; the final integration must preserve both task logs and all scripts/routers.

The candidate preview at `https://thebridge-git-feat-m3-listings-the-bridge13.vercel.app` returned HTTP 302 to Vercel SSO for `/`, `/api/health`, `/api/listings` and `/api/listings/stats` on November 8. The deployment bot reported Ready, but access protection prevented application/API verification. The coordinator must use an authorized preview session and an isolated Atlas dataset to complete endpoint/seed checks; this document does not treat Ready or the SSO response as an application pass.
