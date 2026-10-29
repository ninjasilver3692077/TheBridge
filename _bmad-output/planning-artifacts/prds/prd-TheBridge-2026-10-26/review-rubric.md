# PRD Quality Review — TheBridge

## Overall verdict
The PRD is decision-ready and maps every Milestone 2 behavior and every rubric week to stable FR/NFR IDs. The risk sits in state-transition edge cases (Offered Books, removing a Reserved Listing) and in a few FRs without testable consequences, which downstream specs would otherwise invent.

## Decision-readiness — strong
Lifecycle and admin decisions are stated as decisions (§4.6, §4.7); open questions §10 are real and owned.

## Substance over theater — strong
No persona theater; four UJs each drive FRs. NFRs carry concrete codes and bodies.

## Strategic coherence — strong
Thesis: a shared, persistent marketplace instead of per-browser data. §8 and SM-1..SM-3 follow it; counter-metrics present.

## Done-ness clarity — adequate
### Findings
- **high** Offered Book is not locked (§4.3 FR-9, §4.6 FR-17) — An Available Library Book offered in a Pending Exchange Request can still be published, edited, deleted, or offered again. Milestone 2 blocks this (`isBookFree`). *Fix:* add a consequence: a Library Book that is the Offered Book of a Pending Request cannot be edited, deleted, published, or offered again; it is freed when that Request is Rejected or Cancelled.
- **high** Removing a Reserved Listing (§4.7 FR-24) — only Pending Requests are handled; the Accepted Request and the Reserved/Lent books are left dangling. *Fix:* the Accepted Request becomes Rejected and both the Library Book and any Offered Book return to Available.
- **medium** Page size unspecified (§4.5 FR-13, §5 NFR-6) — "pages of a fixed size." *Fix:* default 10 per page, matching the rubric's `limit=10`.
- **medium** Home summary undefined (§4.5 FR-16) — "community summary" has no content. *Fix:* name the four figures and the four newest Listings Milestone 2 shows.
- **low** FR-14, FR-22, FR-25–FR-28 have no consequences — acceptable where the statement is itself testable.

## Scope honesty — adequate
### Findings
- **medium** Account self-service missing from Non-Goals (§7) — profile edits, password change and reset are silently absent. *Fix:* add a Non-Goal.

## Downstream usability — adequate
### Findings
- **medium** Undefined terms (§3) — "visitor," "session," and "admin area" are used throughout but not in the Glossary. *Fix:* add Visitor, Session, Admin Area.

## Shape fit — strong
Brownfield markers (Implemented/Partial/New) suit a chain-top PRD feeding architecture and specs.

## Mechanical notes
- All assumptions confirmed by Juan; inline tags and §11 index can be removed and §0 updated.
- FR-1..FR-28, NFR-1..NFR-19, UJ-1..UJ-4, SM-1..SM-4 are contiguous.
