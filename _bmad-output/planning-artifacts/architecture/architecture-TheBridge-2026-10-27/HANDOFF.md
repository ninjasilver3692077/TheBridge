# Issue #9 — Architecture review handoff

Status: local documentation prepared for human review. **Issue #9 remains open until Juan and Jorge approve.** This handoff records artifact checks, not a self-review approval or an implemented full-stack application.

## Deliverables and provenance

- [Architecture](../../architecture.md): boundaries, client/server layout, graded paths, data/state ownership, security, runtime, deployment, migration and review gates.
- [Canonical REST contract](../../../../api-design.md): 31 operations, FR references, payload/response definitions, auth/ownership, errors, pagination and concurrency.
- [Decision summary](../../../../DECISIONS.md): proposed issue #9 choices explicitly pending approval.
- [Architecture spine](ARCHITECTURE-SPINE.md) and `.memlog.md`: BMAD invariants and append-only decision provenance.
- [AI log](../../../../AI-LOG.md): assistance, corrections, verification and remaining human review.

Main source: `dc7bd2c`. Current PRD source: PR #13 at `e8545a29e7a4502a282f06f21c044de1e0b5cd79`, reconciled on 2026-10-28. The PRD is marked final and ready for review but remains unmerged and has no recorded human approval. The original 2026-10-27 internal reports used `6f12ef9210f8ffa533fb0e21dd8ccc1deac6f275`; their historical input is preserved. The PRD/brief remain on Juan's branch; no peer-owned artifacts were merged or edited to manufacture a dependency approval.

## Input update on 2026-10-28

- Contract version 2 uses the FR-13/NFR-6 default of 10 per collection page; the Open Library maximum of 20 is unchanged.
- A-4/A-5 now distinguish product requirements confirmed by the PRD author from architecture approval; A-1–A-3 remain proposed interpretations.
- FR-24 now explicitly rejects Accepted requests. Q-1 remains necessary because rejection does not prove physical return of a Lent book, and removing an already Removed listing must not release a newer listing's copy.
- Both open peer PRs (#7 and #13) requested Edwin's review. After explicit user authorization, [Gate 1 spec approval](https://github.com/ninjasilver3692077/TheBridge/pull/7#issuecomment-6466834313) was posted on #7 at bfc6e29 and a [Request changes review](https://github.com/ninjasilver3692077/TheBridge/pull/13#pullrequestreview-5681311863) on #13 at e8545a2. Neither peer branch was edited. Review notes remain separate from this architecture branch.
- The PRD update changes no operation IDs or FR/NFR IDs. The architecture and contract remain proposals requiring Juan and Jorge's approval.

## What is resolved for review

| Issue #9 acceptance item / PRD question | Proposed answer |
| --- | --- |
| client/ + server/ layout | React in client; Express composition/services/repositories in server; actual root route/model modules for literal grader paths. |
| REST contract tied to FRs | Canonical api-design.md; every operation cites an FR, with full model/payload/error rules. |
| Storage, port, Vite proxy | Atlas/Mongoose after HW11, local API 3000/client 5173, unchanged /api prefix through proxy. |
| Deployment | One Vercel origin, shared API function before SPA fallback; actual provisioning/base migration belongs to an approved hosting story. |
| PRD Q1: graded paths | Root real routes/, models/, src/types.ts and required documents; no symlinks or duplicate implementations. Instructor source-collection confirmation remains a submission gate. |
| PRD Q2: contract ownership | api-design.md owns HTTP; architecture owns structure and links to it. |
| PRD Q3: Admin creation | Explicit idempotent offline command, one-off environment credentials, no public promotion/default password. |

## Internal review disposition

These reviews were required by the architecture skill. They do not replace the reviewers named in the issue.

| Review | Disposition |
| --- | --- |
| [Requirements reconciliation](reviews/input-requirements.md) | Added offered-copy participant summary, reproducible HW11 copy fixtures, any-page expiry and weekly public-deployment/AI-LOG gates. |
| [Code reconciliation](reviews/input-code.md) | Added currentListing/activity semantics and full available-dataset facets; corrected resolved React version to 19.3.0. |
| [Technology gate](reviews/gate-technology.md) | PASS: registry/lockfile/runtime/database/auth choices checked; no false installation or deployment claim. |
| [Rubric gate](reviews/gate-rubric.md) | Original common-write concurrency issue and no-any evidence clarification verified resolved. |
| [Adversarial seams](reviews/gate-seams.md) | S-1–S-4 verified resolved: internal revision, temporal snapshots, session generation and HW12 identity cutover. |
| [Editorial structure](reviews/editorial-structure.md) | Added early gate navigation, payload links and auth subheadings; preserved all 31 operations. |
| [Editorial prose](reviews/editorial-prose.md) | Applied three clarity fixes for registration rejection, request participant access and saved-data timestamps; technical content remains intact. |

## Verification performed

| Check | Actual result |
| --- | --- |
| npm run lint | Passed, zero errors/warnings. |
| npm run build | Passed; existing bundle and dist/404.html generated. |
| BMAD lint_spine.py | Passed, zero findings. |
| Contract structure | 31 unique operation IDs and method/path pairs; all operations cite FRs. |
| Requirement map | FR-1–FR-28 and NFR-1–NFR-19 present in the traceability matrix. |
| JSON examples | Five parsed successfully. |
| Markdown links | Local deliverable paths and payload/gate anchors checked. |
| Mermaid | Four diagrams parsed successfully using temporary Mermaid 12.2.0 tooling. |
| Scope | No runtime code, package/lock files, assets, deployment configuration, team policies or peer-owned planning files changed. |

Backend endpoint, transaction, auth, typecheck and Vercel checks are **future required evidence**, not executed against a nonexistent implementation. Tests enumerated in architecture §9 are requirements for the implementing stories. No production URL, account or credential was created.

## Approval checklist for Juan and Jorge

- Confirm the repository-path exception for real root routes/models/shared types.
- Review contract DTOs, errors, version preconditions and transaction/write-barrier semantics.
- Confirm A-1–A-3, especially loan/rental completion and changed-term acceptance; A-4/A-5 record requirements already confirmed by the PRD author.
- Resolve Q-1 before implementing Reserved-listing moderation; the temporary 409 is explicitly not full FR-24 compliance.
- Keep hosting resources/shared limiter, demo content and grading-source confirmation assigned to their downstream owners.
- Record both approvals before merging this architecture and treating its proposed choices as agreed.

## Publication authorization and commands

AGENTS.md normally says: “Commit locally from the person's account, but never push or open pull requests; give the person the exact commands to run.” On 2026-10-28 the user explicitly authorized the agent to perform necessary commits, pulls and pushes and handle the remaining publication steps. This is a session authorization for publishing this documentation branch and its draft PR; it does not edit team policy or authorize commits to main, force pushes, merges, deployment, self-review or implementation before spec approval.

Publication uses the following commands from the repository directory, after checking the commit and remote state:

```powershell
git status
git log -1 --oneline
git push -u origin docs/architecture
```

Then create a **draft documentation PR** targeting main and request review from `ninjasilver3692077` (Juan) and `jfontx` (Jorge). The agent can perform this through the authenticated GitHub API under the explicit authorization above. [Branch comparison](https://github.com/ninjasilver3692077/TheBridge/compare/main...docs/architecture?expand=1) remains a manual fallback. This planning PR contains no implementation stage to approve on the author's behalf.

Suggested title: `docs: define full-stack architecture and API contract`.

Suggested PR body:

```markdown
## Problem and result

Issue #9 needs an agreed architecture and REST contract before the Express skeleton and client integration can be implemented independently. This documentation-only proposal defines the client/server boundaries, real graded paths, shared DTO ownership, 31 FR-linked operations, state consistency, Admin bootstrap and the staged Vercel target.

## Review inputs

- Main: dc7bd2c.
- PRD input: PR #13 at e8545a2, ready for review but unmerged; no peer-owned PRD files changed.
- Canonical HTTP contract: api-design.md.
- Main artifact: _bmad-output/planning-artifacts/architecture.md.

## Validation

- Frontend lint and build passed.
- BMAD spine lint: zero findings.
- 31 unique operations, 28 FR and 19 NFR mapped, five JSON examples checked, local links/anchors and four Mermaid diagrams checked.
- Independent input, technology, rubric, seam and editorial checks are documented in the architecture handoff; they are not human approval.
- No application code, dependencies, assets or deployment settings changed.

## Decisions requiring review

Please review the proposed root graded-module layout, canonical API ownership and offline Admin bootstrap. A-1–A-3 remain product interpretations requiring confirmation; A-4/A-5 now record confirmed PRD requirements. Collection pagination defaults to 10. Q-1 explicitly gates Reserved-listing moderation pending safe physical-return rules; actual hosting/limiter resources and grading-source confirmation have downstream owners.

Required reviewers: Juan and Jorge. Keep issue #9 open until both approve; subsequent code still requires an approved OpenSpec change.

Closes #9 after the required reviews and merge.
```
