# Design

## Context

The client is a React 19 + Vite + React Router 6 app that keeps all data in the browser: sample data in `src/data/`, user data in `localStorage` through `src/services/`, and book metadata from the public Open Library API. There is no server and no real account. See `proposal.md` for why the baseline is needed and what it leaves out.

The specs were written from the code on `main` at commit `06be73a`, read page by page (`App.jsx`, `LoginPage.jsx`, `MarketplacePage.jsx`, `MyBooksPage.jsx`, `AddBookPage.jsx`, their components, hooks, and services). Every number and string in a scenario was checked by running the pure logic (filtering, statistics, offer labels, price format, request activity, library book creation) against the real modules in Node with a stand-in for `localStorage`. Browser-only behavior (focus handling, dialog layering, scroll lock, live regions) was traced in the source and still needs the manual pass in `tasks.md` 2.4.

## Goals / Non-Goals

**Goals:**
- Record observable behavior a user or test can verify, in the project's spec format, with Given/When/Then-style scenarios.
- Give Milestone 3 stories a baseline to modify: each later story changes a named requirement instead of describing the whole screen again.
- Make the gaps between the PRD and the code visible to the reviewer, without fixing or hiding them.

**Non-Goals:**
- Prescribing behavior the code lacks. A spec that says what the PRD wants would make the baseline false.
- Specifying implementation: component names, hooks, storage keys, and event names stay out of the specs.
- Writing tests. Scenarios are written to be testable later; this change adds none.

## Decisions

**Three capabilities, as the issue asks.** `auth`, `marketplace`, and `my-books`. Add Book lives inside `my-books` because it exists only to add a book to that library and shares its statuses and conditions. Alternative: a separate `add-book` capability. Rejected because the issue names three output specs, and Add Book's only output is a library entry.

**Marketplace covers community listings only.** The page also holds an Open Library catalog search and a Favorites panel. The issue sends "catalog search" to cleanup changes 0-1 to 0-3, and change 0-3 moves search validation and favorites into services, so a spec written now would be rewritten immediately. Add Book's own catalog search stays in `my-books` because it is part of adding a book, not of browsing.

**Describe the code, not the PRD.** Where they differ, the spec follows the code and the difference is listed below. Alternative: write the PRD's wording and mark the spec "partial". Rejected because Gate 1 would then approve claims nobody can verify against today's app.

**Scenarios use the sample data's real values.** For example, 24 listings, "COP 36,833" average, "The Hobbit" for Loan plus Fantasy. These make scenarios executable by hand. The cost is that they break if the sample data changes; a change that edits the sample data must update them.

**Auth is specified as it is: a local flag.** The specs say "member session" and never name the storage mechanism, so the Milestone 3 change that replaces it with real accounts modifies requirements instead of rewriting them.

## Risks / Trade-offs

- [A scenario hard-codes sample data] → The proposal's "Later work" names the dependency; the reviewer can ask for fewer literals if this is too brittle.
- [Browser-only behavior was traced, not run] → Task 2.4 is a manual pass over every page; the reviewer repeats a sample of it.
- [The Open Library responses change over time] → Scenarios that depend on the catalog state counts generically ("returns 7 books") and never name real results.
- [Recording a quirk reads as endorsing it] → Quirks below are listed as observations; none appears as a requirement unless it is user-visible and stable.

## Observed gaps and quirks

These are not requirements. They are what a reader should know before using the specs, and candidates for later changes.

| Area | What the code does | PRD or expectation |
|---|---|---|
| Marketplace | Shows every listing on one page; does not filter by status | FR-13: only Available listings, pages of 10 |
| Auth | One "Continue as member" button, no credentials | FR-1, FR-2 (planned) |
| Auth | No sign-out; the session never expires | FR-2, FR-4 (planned) |
| Auth | After sign-in always lands on My Books, even when sent from Requests | FR-4: return to the page the person was on |
| Auth | Header user button ("Open user profile") does nothing and says "Member" even without a session | Not specified |
| Auth | The session check reads storage without a guard; blocked storage would break protected pages | Not specified |
| My Books | Empty library under "All" reads "No all books" and has no "Add book" link | FR-7: empty state with a link to Add Book |
| My Books | Sample and starter books show for every signed-in browser | FR-7: new accounts start empty |
| Add Book | Books added from the catalog get the genre "Default", so cards read "Default · Like new" | Not specified |
| Add Book | The missing-condition error is not an alert; the search error is | Accessibility consistency |
| Add Book | The same catalog book can be added twice | FR-8 silent |
| Marketplace | Quick view's cover has no fallback when the image fails; the card's does | Consistency |
| Docs | The Milestone 1 team guide says Add Book uses mock data; the code uses Open Library | The code is the baseline |
