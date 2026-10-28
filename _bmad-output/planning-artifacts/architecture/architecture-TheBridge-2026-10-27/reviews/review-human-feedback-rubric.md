# Human-feedback reconciliation and architecture rubric check

Date: 2026-10-28. Scope: PR #14 corrections against both human reviews of `9f129861526f1868685a0126343e4a4174ec3df8`.

**Verdict: PASS for this internal artifact check; no outstanding findings within the assigned correction scope.** All three blocking observations and six follow-ups have an explicit, consistent disposition. This report is input reconciliation and a rubric check, not a formal review, human approval, self-approval, authorization to implement, or evidence of backend behavior.

## Inputs and boundary

Read the supplied `human-reviews.json` and complete `corrections.diff` under `C:/Users/andre/AppData/Local/Temp/thebridge-pr14-corrections-9882c5a1f988402dbdc44868a21238cb/`, then checked the current [architecture](../../../architecture.md), [canonical API contract](../../../../../api-design.md), [spine](../ARCHITECTURE-SPINE.md), [handoff](../HANDOFF.md) and [AI log](../../../../../AI-LOG.md) tail. Compared spine decision IDs and API operation IDs with HEAD: AD-1–AD-10 and all 31 operation IDs retain their identities and order. The reviewed correction diff changes documentation only.

The PRD input stays pinned to `e8545a29e7a4502a282f06f21c044de1e0b5cd79`. The newer unmerged `a1fc15f` decisions are deliberately assigned to issue #15 after PR #13 merges. That follow-up is a visible dependency, not a missing correction in this bounded update. No external review state, publication authorization or PRD merge state was independently refreshed for this internal check.

## Human review items

| Item | Result and evidence |
| --- | --- |
| B1 — FR-24 partial coverage | Addressed. Architecture §8 separates FR-22–FR-23 from an explicitly partial FR-24 row. API §3 ADMIN-05 and the spine capability map preserve that qualification: Available removal is covered; Reserved removal remains the temporary 409 branch pending issue #15. Full FR-24 compliance is never claimed. |
| B2 — Bounded transaction retries | Addressed. Architecture §4 specifies three body attempts total, fresh precondition reads, known-aborted transient failures only, and 25–100 ms jitter. Domain validation, stale state/version and duplicate-key failures do not enter that loop. A separate three-call commit cap applies per transaction. Unknown commit results retry only the same commit identity; exhausted uncertainty returns sanitized 503 and refetch/reconciliation without body replay or a rollback promise. Core API ownership, no nested automatic retry helper, finite request-budget timeouts and cleanup constrain hidden retry paths. API §1 and AD-6 agree. |
| B3 — LibraryBook internal versus public version | Addressed. Architecture §4 and API §1 distinguish internal contention `revision` from public domain `version`. Pending offer activity changes only the internal barrier when stored domain fields/status do not change. Active activity still blocks COPY-04/05 through separate eligibility checks. After release, the original If-Match remains current if no versioned field changed. Stored metadata/condition/notes/lifecycle changes increment public version; derived projections and bookkeeping timestamps do not. AD-6 and the spine conventions preserve the distinction. |
| F1 — Request rejection cause | Addressed. API §2 defines server-owned nullable `rejectionReason`, non-null exactly for Rejected, with OwnerRejected, CompetingRequestAccepted, ListingWithdrawn and ListingRemoved. Command mappings and architecture transition effects distinguish each cause; participant/Admin DTOs receive the enum without private moderation text. Other states use null. |
| F2 — Expired bearer on public routes | Addressed. API §1 explicitly ignores Authorization headers, including expired/malformed tokens, on Public operations and keeps anonymous projections/status. Protected operations still require verification and return 401 for invalid/expired tokens. Architecture session expiry monitoring remains active on public pages, so ignoring a public bearer does not disable FR-4 client expiry behavior. |
| F3 — JWT startup configuration | Addressed. Architecture §5 rejects missing/default/example or short secrets, requires an operator-supplied random secret, strictly parses a safe integer TTL equal to 86400, and passes a numeric value to expiresIn. Issuer/audience validation, HS256 allowlisting, readiness failure and secret-safe logging are explicit. API auth rules and AD-5 point to the same boundary. |
| F4 — Dummy login hash comparison | Addressed. Architecture §5 and API auth rules require one asynchronous bcrypt comparison against a valid dummy hash at the configured cost for a valid login with an absent email. The hash is prepared once per cost; the comparison cannot authenticate an unknown account. The generic 401 response remains identical, without claiming perfect timing equality. |
| F5 — Client-token storage risk | Addressed as a documented residual risk pending acknowledgement. Architecture §5 identifies same-origin JavaScript/XSS exfiltration, limits of mitigation and expiry/local logout, and the course-driven storage trade-off. Juan/Jorge acknowledgement is an explicit pre-auth-implementation gate. AD-5 and the handoff carry the gate. No team risk acceptance is fabricated. |
| F6 — ADMIN-05 missing reason | Addressed. DELETE retains its JSON body. For an authenticated authorized Admin, missing body/reason, non-string, whitespace-only or trimmed-over-500-character reason returns 400. The API forbids silently dropping the body or substituting an empty reason; valid moderation retains actor/reason. |

Architecture §9 explicitly requires downstream evidence for the new retry, version, rejection, auth and moderation failure cases. These are implementation-story requirements; this documentation check does not claim they have executed or passed.

## Good-spine checklist

| Criterion | Result and evidence |
| --- | --- |
| Real implementation divergence points covered | Pass. Existing service boundaries, canonical DTO ownership, graded modules, physical-copy identity, authorization, atomic transitions, quotes/history, routing and persistent multi-instance behavior remain governed by AD-1–AD-10. Corrections add explicit retry ownership, uncertain-commit handling, version semantics and auth boundaries at those existing decision points. |
| Rules enforceable | Pass. The updated Rules name concrete caps, operations, error outcomes and authority boundaries. Architecture/API provide the precise jitter, failure-class, enum and configuration details; they do not introduce an independent alternative to a spine Rule. AD-2 fixes the canonical contract owner for implementers. |
| No hidden independent implementation choices | Pass. Public token handling, dummy comparison, rejection causes and copy token scope now have one declared behavior. Unknown commit outcome cannot be mistaken for a known-aborted body retry. Infrastructure providers remain deferred with required behavior fixed. |
| Stable decision identity | Pass. AD-1–AD-10 are unchanged identifiers in the same order; corrections extend AD-5/AD-6/AD-7 rather than creating parallel decisions. All 31 operation identifiers also remain stable. |
| Brownfield constraints retained | Pass. The client service boundary, protected branding, existing source/deployment layout and course sequencing are not changed by this documentation diff. No runtime, dependency, asset or deployment change is inferred from the corrected design. |
| Coverage honestly bounded | Pass. FR-24 is partial throughout the operative contract/traceability surfaces. Issue #15 explicitly owns reconfirmation fields/operations, offered-copy lock ownership, Reserved moderation/completion, return-confirmation wording and quick-view request rules after PR #13 merges. A-1/A-3/Q-1 are retained as current-input contract gaps while the text acknowledges newer product decisions already exist. |
| Approval and deployment gates preserved | Pass. Human review, approved downstream OpenSpec changes, relevant product reconciliation, resource provisioning and actual backend/deployment evidence remain necessary. Internal checks do not discharge these gates. |

## Review provenance and publication question

The supplied review record has Juan requesting changes and Jorge approving the same earlier `9f12986` revision. The corrected architecture, handoff and AI log explicitly state that those states do not approve the new content; both reviewers must assess the resulting revision and issue #9 remains open.

The handoff and AI log distinguish the reported account-holder session authorization for AndresMonca publication/review actions from a permanent AGENTS policy exception. They state that no team-wide approval is documented, no policy amendment is made, and Juan/Jorge were not impersonated. This answers the provenance question without inventing team approval or requiring an unsupported change of reviewer identity. This check assesses that distinction in the documents, not the historical authorization itself.

No correction is requested from this internal pass. Remaining human approvals, client-storage risk acknowledgement and merge-dependent issue #15 reconciliation remain explicit requirements before the affected implementation.
