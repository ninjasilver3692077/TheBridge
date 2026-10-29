# PRD-update adversarial seam gate

Date: 2026-10-28

## Verdict

**PASS for the bounded documentation reconciliation. No new blocking seam found.** This is an internal architecture-artifact check, not human architecture approval, an OpenSpec approval, code review or runtime verification.

Inputs: the working-tree diff; `ARCHITECTURE-SPINE.md`; the complete architecture companion and root `api-design.md` version 2; PR #13's local PRD input at `e8545a29e7a4502a282f06f21c044de1e0b5cd79`. The review targets only changed boundaries. Existing transaction, snapshot and session barriers were read as governing constraints, not reopened as new work.

Method: try to construct two independently implemented units that both obey the applicable decisions and canonical contract, yet disagree at a changed seam. No such counterexample survived the declared constraints below.

## Counterexample attempts

| Boundary and references | Independent units attempted | Result |
| --- | --- | --- |
| Pagination: spine AD-2; API sections 1 and 3; PRD FR-5, FR-13, NFR-6 | A database listing handler defaults to 10; a catalog adapter preserves Open Library's up-to-20 result search. Alternatively, a database handler keeps the former default 20, or a catalog adapter applies the API's page envelope to Open Library. | The first pair is compatible: the API pagination rule explicitly covers database collection endpoints, while catalog search remains a direct public Open Library service, not an `/api/catalog` route. The latter database handler violates the explicit default 10. FR-5 still binds the catalog cap of 20; the update does not replace that cap with a database page-size policy. Home's explicit `limit=4` also remains compatible with a default of 10. |
| Pending offered-copy guards: spine AD-6/AD-7; architecture section 4 and A-4; API COPY-04/05, LISTING-05 and REQUEST-01; PRD FR-9/FR-19 | A request service leaves the Pending offered copy visibly Available and derives its activity from active requests; a copy/publication service therefore permits edit/delete/publish based only on status. A second request service tries to offer that same copy elsewhere. | The status-only copy service is not compliant: COPY-04/05 additionally require no active offered activity, Publish explicitly forbids an active outgoing exchange offer, and REQUEST-01 rejects occupied offers. The Pending/Accepted offered-copy unique index and common copy-document contention prevent independent request/publication reads from admitting both operations. Rejected/Cancelled releases the derived activity; acceptance sets the offered copy Reserved. A-4's product confirmation changes its provenance, not the existing technical guard. |
| Confirmed product requirements versus architecture approval: spine AD-10 and Deferred Gates; architecture introduction and A-4/A-5; API introduction | An auth/favorites implementer treats the PRD author's confirmation as approval to implement the architecture immediately; another waits for Juan/Jorge and the story's approved OpenSpec change. | The immediate implementation interpretation violates the explicit review gates. A-5 now correctly cites requirements already stated in FR-1/FR-4/FR-6/FR-20/FR-21; this does not approve issuer/audience, hashing policy, technical enforcement or downstream code. The spine expressly retains architecture approval and an approved OpenSpec change. PRD author confirmation is attributed to the PRD text, not presented as a recorded human PR approval. |
| Moderation settlement and repeated removal: spine AD-7; architecture section 4 and Q-1; API ADMIN-05; PRD FR-24 | An admin service follows FR-24 by rejecting an Accepted Loan request and releasing its Lent copy; a library service interprets that as proof the physical book is back. Separately, an old Removed listing is removed again after its copy has been republished, releasing the new listing's copy. | The first pair crosses an explicit implementation gate: Reserved moderation currently returns 409 pending an amended settlement contract. The update acknowledges that FR-24 now specifies Accepted-to-Rejected, and isolates the still-unresolved physical availability policy instead of calling the request terminal state unspecified. The second admin service violates ADMIN-05's explicit Removed-to-409 rule, including the prohibition on releasing a newer listing's copy. Available removal retains the existing atomic rejection/release effects. Neither unsafe operation is authorized by the current proposal. |

## Deliberately retained gates

A-1 completion timing, A-2 withdrawal semantics, A-3 changed-term consent and Q-1 safe Reserved moderation are openly gated before their affected stories. They are not hidden implementation choices or findings from this bounded pass. In particular, the temporary 409 behavior is explicitly an exception to full FR-24 compliance, not a claim that the updated PRD has been fully implemented.

## Disposition and later evidence

The reconciliation can proceed to the required human review without a new seam correction. Preserve the existing approval gates. When the affected implementation stories are approved, require endpoint evidence for default-10 collection metadata and explicit limits; catalog searches capped at 20; Pending-offer edit/delete/publish/reoffer conflicts and release on rejection/cancellation; and repeat removal returning 409 without changing the newer listing/copy. Reserved moderation needs its product decision and amended contract before implementation or corresponding runtime evidence can be required.

Only this report was added. No application code, product decision, approval, publication or deployment was performed.
