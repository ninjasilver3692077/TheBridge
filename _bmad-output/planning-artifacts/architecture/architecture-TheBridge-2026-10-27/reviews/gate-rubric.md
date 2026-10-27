# Architecture gate: independent rubric walker

Date: 2026-10-27. Branch: `docs/architecture`. Lens: the good-spine checklist in the architecture workflow's reviewer gate. This is an internal artifact check, not a human PR approval, a formal code review, permission to implement, or a grading result.

**Gate verdict: revise the request-creation serialization rule before implementation handoff; the architecture is otherwise coherent, reviewable, and honest about its downstream product and deployment gates.** No critical finding. One high finding is recorded below. The author has acknowledged it and plans a documentation correction; this report records the reviewed wording, rather than assuming the correction has already been made.

## Reviewed evidence

- Current `ARCHITECTURE-SPINE.md`, `_bmad-output/planning-artifacts/architecture.md`, and root `api-design.md`.
- Draft PRD supplied at `C:/Users/andre/AppData/Local/Temp/thebridge-architecture-inputs/prd.md`, identified in the artifacts as PR #13 at `6f12ef9210f8ffa533fb0e21dd8ccc1deac6f275`.
- Current `AGENTS.md`, `CONTRIBUTING.md`, `package.json`, and lockfile resolution for the brownfield constraints and dependency distinctions.
- Deterministic spine lint: `uv run .claude/skills/bmad-architecture/scripts/lint_spine.py --workspace _bmad-output/planning-artifacts/architecture/architecture-TheBridge-2026-10-27` returned `ok: true`, `total_findings: 0`.
- Primary-source spot checks: [Mongoose transactions](https://mongoosejs.com/docs/transactions.html), [MongoDB transaction production considerations](https://www.mongodb.com/docs/manual/core/transactions-production-consideration/), [Express on Vercel](https://vercel.com/docs/frameworks/backend/express), and [Express registry metadata](https://registry.npmjs.org/express/latest). These support the transaction/session and single-function direction; they do not establish that a proposed deployment already works.

## High finding

### R-1: Serialize Pending creation with listing lifecycle changes

**Locations:** spine AD-6; architecture section 4, Mutation authority and Send request/Accept/Withdraw/Remove rows; API REQUEST-01 and request transition rules.

**Observed wording:** the architecture explicitly requires offered-copy contention to prevent offer-versus-publication races. For a non-Exchange Request, however, Send request is defined as checking an Available listing/current quote and inserting a Pending Request. It does not unambiguously require a write to a document also written by accept, withdrawal or removal. The transaction and uniqueness rules do not close this gap on their own.

**Failure sequence:** request creation reads an Available listing in its transaction. Withdrawal or acceptance changes the listing and rejects the Pending Requests visible to its own transaction. Request creation then inserts a different Pending document and commits. With disjoint writes, both transactions can succeed, leaving a late Pending request on a Closed/Reserved listing; withdrawal's promise to reject every Pending request is broken. The same seam exists with removal. No actual backend defect is asserted, because this issue has no backend implementation yet.

MongoDB's documentation explicitly warns that transaction reads can be stale and describes a real document modification as the way to acquire the relevant write lock. The counterexample and required shared-write interpretation are an inference from those guarantees and the proposed write set. [MongoDB transaction production considerations](https://www.mongodb.com/docs/manual/core/transactions-production-consideration/).

**Requested correction:** name a shared, mandatory contention document for every Request creation and every affected listing lifecycle mutation. Require an atomic guarded write in the same session, then revalidation on retry and 409 when the listing is no longer Available/current. An internal Listing revision distinct from the public terms/version is one suitable design: inserting an unrelated Pending request must not make existing quoted terms stale. Add send-versus-withdraw/accept/remove race evidence to the downstream test gate, including absence of orphan Pending records. Update AD-6 and the canonical contract together.

**Disposition:** autofix the architecture/contract rule before handoff. This is an implementation consistency decision, not a new product feature and not a reason to delay the transport-only Express skeleton after the normal approvals.

## Good-spine checklist

| Criterion | Assessment |
| --- | --- |
| Real divergence points fixed at this altitude | Pass subject to R-1. Physical copy identity, DTO ownership, real graded modules, stored authorization, atomic state changes, quote history, origins/routing and multi-instance persistence are explicit. |
| AD Rules enforceable and sufficient for their stated purpose | AD-1 through AD-5 and AD-7 through AD-10 are reviewable constraints. AD-6 needs the shared-write clarification in R-1. Mechanical Binds/Prevents/Rule fields and IDs pass lint. |
| Deferred items cannot silently create incompatible implementations | Pass. Q-1 blocks Reserved moderation; Q-2 binds deployment behavior while deferring resource selection; Q-3 is a grading-source confirmation gate. A-1 through A-5 name approval conditions before affected domain stories. |
| Current technology and named versions | Pass for proposal handoff. Lockfile React/React DOM 19.3.0 is correctly distinguished from the manifest range; no dependency upgrade is asserted. Express 5.3.0 and Mongoose 9.11.4 were independently spot-checked. The author records a dated registry check and primary sources for the full seed; this reviewer did not independently re-query every listed package. |
| Brownfield compatibility | Pass. Existing CDN Tailwind, protected assets, service adapters, physical/catalog identity, asynchronous migration, legacy Lent mapping and the current GitHub Pages base remain compatible with the proposed staged work. No source migration or deployment is claimed to have happened. |
| Driven capabilities covered | Pass at architecture altitude. FR-1 through FR-28 and NFR-1 through NFR-19 have assigned boundaries and downstream gates. Catalog search/cache remains public; account favorites, library activity, offered-copy summaries, listing facets and participant history have explicit replacements. |
| Inherited policies retained | Pass. Human spec/contract approval, separate implementation stories, no self-approval, no agent publication, no code comments, English deliverables and coordinator deployment authority are preserved. No inherited parent architecture spine was supplied. |
| All owned dimensions addressed | Pass. The proposal covers UI/service/domain/repository boundaries, data consistency, API ownership, authorization/privacy, local and deployed environments, hosting/provider strategy, readiness/errors/logging, resource/secret isolation, migration and rollout verification. Exact infrastructure provisioning is honestly deferred with an owner/gate. No whole owned dimension is silent. |

## Product gates and issue #9 readiness

Q-1 is an explicit and appropriate gate. FR-24's non-Closed removal promise conflicts with the accepted Loan/Rental Lent state and Accepted Request. The proposed 409 for Reserved moderation is labelled an exception and is not claimed as complete FR-24 compliance. Do not treat this already documented product question as an unacknowledged architecture omission.

A-1 distinguishes return from pickup before Loan/Rental completion; A-3 governs stale terms; A-4 governs offered-copy exclusivity; A-5 retains draft PRD assumptions. These are review proposals rather than fabricated product decisions. They can remain pending for issue #9's documentation review provided affected implementation stories remain gated.

The artifacts answer the issue's structural questions: actual root graded modules, sole HTTP contract source, shared type ownership, client/server separation, Admin bootstrap and staged Vercel hosting. The author still needs Juan/Jorge's recorded reviews before issue #9 can be marked complete. This internal gate does not substitute for either reviewer.

The already corrected offered-book DTOs, My Books activity, global listing facets, HW11 copy fixtures, public-page expiry observer, weekly submission URL/evidence and React lock version are present and are not outstanding findings.

## Non-blocking implementation tail

One verification detail should survive HW14 planning: strict/noEmit plus incremental `allowJs` does not prove the no-`any` acceptance rule. Architecture section 3 narrows its explicit wording to migrated code. Keep the minimum migration bounded, but require checks for explicit `any` in authored TypeScript and typed request/response bodies in the two migrated real route files, according to the supplied rubric. This is a downstream acceptance-evidence clarification; it does not justify broadening the migration or blocking the architecture skeleton.

No code, dependency, deployment or human approval result is inferred from this document review. Reviewers should re-read the final R-1 correction and rerun the mechanical lint after reconciliation.

## Verification after reconciliation

Rechecked on 2026-10-27, limited to R-1 and the HW14 verification tail. The original observations above remain as review history.

- **R-1 resolved at documentation level.** Architecture section 4 now requires every Pending creation and edit/accept/withdraw/remove/complete command to conditionally write the same internal Listing revision in its transaction. Retried insertions must re-read status/quote and cannot insert Pending after reservation or closure. The internal revision is explicitly separate from the public/quoted version, so an unrelated Pending insertion does not invalidate existing quotes. Spine AD-6 and API global Concurrency carry the same rule. Architecture section 9 now requires new-Pending-versus-accept/withdraw/remove races and absence of late Pending records, alongside rollback consistency. This satisfies the requested shared-write clarification and downstream evidence gate.
- **HW14 tail resolved.** Architecture section 3 now prohibits explicit `any` in all authored TS/TSX, requires concrete shared generics for route bodies/params/queries/envelopes, and demands both `tsc --noEmit` and a separate no-explicit-any lint check. The bounded incremental migration remains intact.
- **Mechanical check repeated:** spine lint again returned `ok: true`, `total_findings: 0` after the correction.

**Final rubric disposition: no original blocking finding remains.** The artifacts pass this internal rubric gate for human review, subject to the already recorded product/deployment gates and Juan/Jorge's required approval. This verifies the design correction, not a working transaction implementation or a formal human PR approval.
