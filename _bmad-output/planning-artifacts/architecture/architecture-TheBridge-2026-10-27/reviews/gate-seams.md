# Adversarial seam gate

Date: 2026-10-27

Scope: architecture spine, architecture companion and canonical root API contract.
Method: construct independently implemented modules that each follow the stated boundaries, then compare their behavior at shared resources and lifecycle boundaries. This is artifact quality control, not the required independent human code review or product approval. No application code was evaluated or changed.

## Verdict

**REVISE before treating the affected domain contracts as implementation-ready.** The principal gap is the listing write boundary for concurrent request creation; three further lifecycle/DTO decisions need explicit convergence. The draft can still be presented for Juan/Jorge review, and unresolved Reserved moderation remains an acknowledged product gate rather than an accidental architecture omission.

Findings describe the reviewed text before the parent incorporates follow-up corrections. Parent-reported intended fixes are recorded separately and are not treated as verified changes.

## Findings

### S-1 — High: request insertion and terminal listing mutations need one shared write barrier

**References:** architecture section 4, Mutation authority and state-transition table; API REQUEST-01 and LISTING-07; spine AD-6/AD-7.

**Independent implementations:** the request service loads an Available listing and its current quoted version inside a transaction, then inserts a Pending non-Exchange request. The withdrawal service closes that listing and rejects the Pending requests found by its own transaction. Both use one session, guarded writes, sequential operations and the declared unique indexes. The specification explicitly requires offered-copy contention, but does not similarly identify the common listing write on request creation.

**Counterexample:** withdrawal reads the competitor set before the request insert; request creation reads the Available listing before withdrawal. The request service inserts its new document while withdrawal updates the listing. Their writes do not overlap, so snapshot reads and the declared unique indexes alone do not prevent both commits. The result is a Closed listing with a Pending request. Accept/remove have the analogous unseen-competitor case. This defeats the intended atomic state machine even though the independently selected transaction boundaries look compliant.

**Required correction:** Pending creation and every command whose competitor set/state depends on it must conditionally write a common listing document in the same transaction. Define a private internal contention revision separately from the public listing/quote version: incrementing the public version on each new request would immediately invalidate existing quotes. Keep quote-changing edits and actual listing transitions as explicitly defined public-version changes. Retry transient conflicts by rereading preconditions; never silently rebase a user's stale quote.

**Evidence to require:** paused transaction tests for send-versus-withdraw, send-versus-remove and send-versus-accept, including non-Exchange creation; assert no Pending request survives on the final non-Available listing. Two concurrent Pending inserts must not make either immutable quote stale merely by existing.

**Follow-up status:** parent has reported a planned common internal revision correction. Verify the final text rather than counting this notification as resolution.

### S-2 — Medium: current listing summaries and immutable request snapshots need an explicit temporal owner

**References:** API shared DTO table (`Listing`, `Request`, `RequestListingSummary`), listing edit semantics and COPY-04; architecture entity table and spine AD-2/AD-7.

**Independent implementations:** one request serializer populates `listing.modality/status` from the current Listing; another captures them at request creation because the table calls the summary retained. One interprets offered-copy nullability using current listing modality; another uses immutable `quotedModality`. Both have an immutable offered-copy snapshot and quoted terms, yet return incompatible Request representations after an Exchange listing is edited to Sale. The phrase "null outside Exchange" does not name the discriminant.

The same ownership ambiguity exists for a historical Listing's condition/description: a serializer may populate current LibraryBook condition/notes, while another stores publication values. After completion of a Loan/Rental, the copy is Available and editable. The old Closed listing can therefore change historical condition/description in one implementation and retain them in another.

**Required correction:** anchor offeredBookId/offeredBook presence to `quotedModality`, and state whether each RequestListingSummary field is live or immutable. State which Listing fields are publication snapshots and persist those fields if history must remain stable after later copy edits/tombstones. A deliberate live-history policy is also possible, but must be shared rather than selected independently by serializers.

**Evidence to require:** create an Exchange request, edit the listing to Sale, and inspect the still-Pending request; the quote and offered snapshot must remain internally consistent. Complete a Loan, edit the returned copy's condition/notes, then read the Closed listing and retained request history; compare against the declared temporal policy.

### S-3 — Medium: clearing private state needs an in-flight response boundary

**References:** architecture section 3 client-service responsibility, section 5 logout/expiry observer; API auth/logout and favorites; spine AD-1/AD-5/AD-9.

**Independent implementations:** authStorage clears tokens and rendered/private caches at logout. A private service request already authorized for account A remains in flight; the response later resolves into a shared hook/store after account B logs in. Another implementation cancels or invalidates that response. Both clear the cache at the stated lifecycle event and the server correctly scoped the original read, but the resulting visible private state differs.

**Required correction:** the session owner issues a generation/identity token captured by every private operation. Its result and error may update client state only while that generation still matches; logout/expiry/account replacement invalidates it before state is cleared. Abort outstanding requests when possible, but do not rely on abort alone. A late 401 for A must likewise not expire B's session.

**Evidence to require:** delay A's favorites/request response and a separate 401, log out, log in as B, then release both responses. Neither A's data nor A's expired-session handling may alter B's session/UI.

### S-4 — Medium: HW12 needs a declared identity bootstrap between HW11 fixtures and HW13 authentication

**References:** API rollout section, especially removal of fixture identities when persistence/auth are introduced; architecture section 7 HW11/HW12/HW13 stages; spine AD-10.

**Independent implementations:** one HW12 repository removes the disposable owner/copy fixtures when Atlas persistence begins, as the API rollout says. Its listing routes still require a server-derived owner, but real authentication is activated at HW13. Another persists a demo owner and defaults routes to it through HW12. Both preserve staged implementation intent, but only the latter can execute listing POST, and its identity policy is not actually declared.

**Required correction:** explicitly choose HW12's disposable identity/setup policy and its removal boundary. For example, allow an intentionally deployed, isolated HW12 course fixture provisioned by an explicit command, with no automatic production fallback and mandatory removal at HW13; or bring real auth forward. Specify how the safe related Account/copy projections are provisioned, and keep the final production policy unchanged.

**Evidence to require:** demonstrate the HW12 public listing CRUD sequence from a fresh environment with the documented setup, then demonstrate that the HW13 configuration cannot enter fixture identity mode.

## Seams checked without additional findings

| Seam | Assessment |
| --- | --- |
| Authority and ownership | Server services own state changes; token identity/stored role and foreign-private-resource 404 behavior are explicit. Shared DTOs do not expose persistence documents. |
| Offered-copy races | Explicit copy-document writes plus active-offer/open-listing unique indexes prevent choosing a read-only offered-copy guard. S-1 concerns the separate listing/request insertion boundary. |
| Enums and basic nullability | LibraryBook/Listing/Request status sets, currentListing/activity vocabulary, integer COP, duration values and explicit nullable metadata are stated. S-2 concerns temporal interpretation, not missing status enums. |
| Query boundaries | Global Available facets are independent of filters/page; stats and list share normalized predicates; all-page totals are not inferred from one collection page. Separate HTTP calls need not be one cross-request database snapshot unless that requirement is later added. |
| History and reserved moderation | Soft closure, participant access and tombstone behavior are explicit. Q-1 clearly gates Reserved moderation and does not authorize release of Lent/Reserved copies; this review does not treat the deliberately unresolved product policy as a hidden defect. |
| Host routing | Root Vercel function boundary, preservation of the original API path/query, API-before-SPA routing and preview verification are explicit. Concrete deployment configuration is appropriately deferred to its approved implementation story. |
| Existing data migration | No silent account import, no final production domain mocks, no automatic production library seed and legacy Loaned-to-Lent mapping are explicit. |
| Weekly evidence | Every weekly URL/lint/evidence/AI-LOG requirement and HW11 fixture copy IDs are now stated. S-4 narrows the remaining cutover question to HW12 identity, not fixture usability in HW11. |

## Gate disposition

Resolve S-1 in the concurrency contract before request-domain implementation. Resolve S-2/S-3 in the canonical DTO/session boundaries before their consuming stories; resolve S-4 before the HW12 persistence story. Record actual corrections and their targeted recheck in the parent review synthesis. None of this substitutes for the required human architecture/spec approvals, author-independent code review, or deployment evidence.

## Targeted verification and final disposition

Rechecked on 2026-10-27 after the parent's corrections. This pass covers only S-1 through S-4; the original findings above are retained as review evidence. **Final seam-gate verdict: PASS at the architecture-artifact level. No original blocker remains.** This disposition supersedes the initial REVISE verdict and its planned-fix status.

| Finding | Verified correction | Disposition |
| --- | --- | --- |
| S-1 | Architecture section 4 now requires Pending creation and edit/accept/withdraw/remove/complete commands to conditionally write the same internal Listing revision in their transaction, then reread state/quote on retry. The internal revision is distinct from the serialized public/quoted version; Pending insertion cannot stale another quote. API global concurrency rules and spine AD-6 state the same invariant. Architecture section 9 adds the missing creation-versus-transition race evidence. | Resolved in design. |
| S-2 | API DTO rows explicitly make Listing book/condition/description publication snapshots. Request offered-copy nullability is anchored to immutable quotedModality; RequestListingSummary metadata/modality are request-time snapshots while status is the current retained Listing status. API payload rules preserve snapshots after later copy edits/deletion; architecture stored fields and spine AD-7 agree. The Exchange-to-Sale and returned-copy-edit counterexamples now have a single defined representation. | Resolved in design. |
| S-3 | Architecture section 5 now increments a session generation at login/logout/expiry, captures generation/account per private operation, and discards both obsolete results and failures. Central 401 handling is expressly limited to the current session. Spine AD-5 mirrors the guard and architecture section 9 requires a delayed account-A response/401 test after B login. Clearing state is no longer the sole protection. | Resolved in design. |
| S-4 | Architecture section 7 and API rollout explicitly seed a persisted demo Member/copies in an isolated HW12 grading database using one-off operator credentials and the shared hashing rules. A temporary server-owned identity adapter targets that persisted Member; in-memory fallback is removed. HW13 must remove the adapter entirely and use real Member/Admin tokens. This supplies the previously missing identity cutover without changing the final production rule. | Resolved in design. |

Verification was a focused comparison of the corrected architecture companion, canonical API contract and spine. No runtime tests, implementation approval, human product decisions, deployment checks or rubric success are claimed. The downstream evidence requested in the original findings remains applicable to their later approved implementation stories.
