# Proposal

## Why

`openspec/specs/` holds a single capability (`app-navigation`), so reviewers and the Milestone 3 stories have no written record of how Marketplace, My Books, Add Book, and sign-in behave today. The PRD marks several requirements "Implemented" or "Partial" against the Milestone 2 client (FR-2, FR-3, FR-7, FR-8, FR-13, FR-14, FR-15), and nobody can check those claims against anything but the code. Writing the current behavior down now gives later changes a baseline to modify instead of rediscover.

BMAD story: **Round 1 · Baseline specs** (GitHub issue #10, owner Daniel, reviewer Jorge); no epic story id exists yet because `epics.md` has not been written. Requirements covered: FR-2, FR-3 (the existing protected-route behavior only), FR-7, FR-8, FR-13, FR-14, and the quick-view part of FR-15. Where the code does not meet the PRD's wording, the spec records what the code does and `design.md` lists the gap.

## What Changes

- Add `openspec/specs/auth`: which areas need a session, how the prototype's sign-in works, and how long a session lasts.
- Add `openspec/specs/marketplace`: the community listing grid, live search, the three filters, the result count, the empty state, the statistics panel, and the quick view dialog.
- Add `openspec/specs/my-books`: the personal library (contents, status filters, per-status actions, request activity) and the Add Book flow (search, select, condition, notes, success).
- Describe behavior only. No source, test, or configuration file changes, and no requirement is invented to match the PRD.

### Out of scope

- Primary navigation, the Home hero, and the catalog search section of the Marketplace (Open Library search and Favorites), which cleanup changes 0-1, 0-2, and 0-3 cover.
- Create Listing, Listing Details, the request dialog's own rules, and Requests; these belong to the baseline of issue #11.
- Anything the PRD marks "New" for Milestone 3: registration, real credentials, logout, session expiry, pagination, edit and delete of a Library Book, and roles.

## Capabilities

### New Capabilities

- `auth`: access to protected areas and the prototype's member sign-in, including how a session starts and persists.
- `marketplace`: browsing, searching, filtering, counting, and quick-viewing the community's listings.
- `my-books`: the member's personal library and the flow that adds a book to it.

### Modified Capabilities

None. `app-navigation` is untouched; this change only adds capabilities.

## Impact

- **Code:** none. The change adds `openspec/changes/baseline-marketplace-mybooks-auth/` and, after archive, `openspec/specs/auth`, `openspec/specs/marketplace`, and `openspec/specs/my-books`.
- **APIs and dependencies:** none.
- **Risk:** low. A spec that misdescribes the code is the only failure mode, so each scenario is traced to the source and the pure logic behind it was run and compared.
- **Later work:** changes 0-2 and 0-3 and the Milestone 3 stories modify these specs instead of creating them.
