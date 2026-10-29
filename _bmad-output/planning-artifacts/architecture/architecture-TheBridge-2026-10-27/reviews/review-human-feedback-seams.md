# PR #14 review corrections: adversarial seam gate

Date: 2026-10-28

Verdict: PASS. The single nonblocking clarification S-1 was resolved and rechecked. No blocking incompatible implementation pair was established for the changed transaction, copy-version, rejection-reason or authentication rules. This is an independent internal artifact check, not human approval of the author's PR and not evidence of implemented backend behavior.

## Inputs and method

Reviewed the current `architecture.md`, root `api-design.md` version 3 and `ARCHITECTURE-SPINE.md` against the supplied `corrections.diff`. For each changed rule, attempted to construct two implementers who both obey the architecture decisions but produce incompatible externally observable behavior. No source code was changed or tested.

The newer PRD reconfirmation, Reserved moderation and completion decisions remain explicitly assigned to issue #15 after PR #13 merges. Their absence from this input version is a documented implementation gate, not a new defect in these corrections. FR-24 is consistently labelled partial.

## Finding

### S-1 — Scope central client 401 handling to protected requests (resolved)

Locations: `architecture.md:186-188`; `api-design.md:32,49,99,103`; AD-5.

The initial reviewed text made the server boundary clear: public operations ignore bearer headers, and invalid credentials on the public login operation still return 401. Its client lifecycle paragraph said it handled a "current-session server 401 centrally" without explicitly excluding that credential failure.

Implementer A routes every 401 received while a session is active through session invalidation; a failed login attempt can clear an otherwise unexpired session and display the expiry message. Implementer B routes only a generation-matched protected request's 401 through session invalidation and leaves a public login 401 as a form error. Both preserve public response anonymity and check actual token expiry on public pages, but their client behavior differs.

Resolution verified on 2026-10-28: architecture's session paragraph and the canonical API account-payload paragraph now both require a protected-operation 401 matching the active generation/account for central invalidation. AUTH-02 credential failures remain form errors and never trigger an expiry redirect; actual expiry remains independently observed. The incompatible pair is no longer permitted. The auth story should exercise this distinction as implementation evidence.

## Attacks closed by the current text

| Seam | Adversarial pair attempted | Result |
| --- | --- | --- |
| LibraryBook internal revision versus public version | Increment public version for a Pending offer versus preserve the old COPY-04/05 precondition | The first implementation violates the explicit contention-only rule. Both must preserve public version, independently reject active-offer mutations, and permit an otherwise unchanged precondition after release. Stored editable fields and status transitions increment public version; derived projections and bookkeeping do not. |
| Body and commit retry budgets | Three retries plus the initial body versus three total bodies; use an automatically retrying transaction wrapper versus a bounded runner | The initial attempt is expressly included in the three-body cap, commit calls are independently capped at three per transaction, and nested automatic transaction helpers are forbidden. Fresh reads, jitter and immediate domain/stale/duplicate errors are specified. |
| Unknown commit outcome | Replay the body after uncertainty versus retry the same commit | Body replay is expressly forbidden; commit retries retain the same session/transaction identity. Exhausted uncertainty returns sanitized unconfirmed-outcome 503, never a rollback promise. Confirmed contention and storage failures have separate mappings. |
| Request rejection reasons | Use null for some Rejected requests, expose moderation text, or infer reason from current listing state | The four server-owned enum causes, exact nullability, atomic status/reason/version update and participant/Admin projection boundary exclude those alternatives. Cancelled and all other non-Rejected states use null. |
| Public bearer versus session expiry | Reject an expired bearer on public reads or upgrade public output when a valid bearer is present | Both violate explicit anonymous projection/status equivalence. Client expiry observation remains active on public pages and is separate from server public-route identity. Resolved S-1 explicitly separates public login errors from protected-session invalidation. |
| JWT TTL | Pass the environment string to `expiresIn` versus a numeric seconds value | Startup requires a positive safe integer equal to 86400 and explicitly requires passing a number. Signature/issuer/audience/expiry checks and secret validation are also explicit. |
| Absent-account bcrypt | Return early, generate a hash on every miss, or authenticate through a dummy match | All three are expressly forbidden. Valid input with no Account requires one asynchronous comparison against a valid same-cost dummy hash prepared once per cost, followed by rejection with the generic credentials response. |
| ADMIN-05 reason | Drop a DELETE body or accept an empty/oversize/non-string reason | The canonical contract retains the JSON body and enumerates the authorized-Admin 400 cases, with trimmed 1–500 character validation. |

## Evidence boundaries

MongoDB's [Core API guidance](https://www.mongodb.com/docs/drivers/node/current/crud/transactions/) confirms that applications own error handling, distinguishing whole-transaction transient retries from unknown-result commit retries. The proposal's numerical caps and jitter are application policy. Deployment timeouts remain a declared downstream verification obligation, not evidence of an existing bounded implementation.

No missing backend code, package installation, production timing result or unmerged issue #15 behavior was treated as a blocker. Required human reviewers must still assess the corrected revision and acknowledge the documented client-storage risk; this gate grants neither approval nor implementation authorization.
