# Human-feedback corrections: structure review

These documents exist to help TheBridge implementers and reviewers understand the proposed architecture, locate the HTTP contract, and identify the approvals and product reconciliation required before implementation.

Reviewed on 2026-10-28. Scope: correction prose added or revised relative to `HEAD` in `_bmad-output/planning-artifacts/architecture.md` and root `api-design.md`. Surrounding content was read for context. Audience: humans implementing or reviewing the proposal. Style baseline: Microsoft Writing Style Guide. Technical semantics and existing scope are preserved; this report proposes editorial changes only.

Structure models: **Explanation (Conceptual)** for architecture, progressing from review context and decisions to boundaries, consistency, security, deployment and implementation gates; **Reference/Database** for the API contract, with shared rules preceding DTOs and operation tables.

## Word-count baseline

Counts were obtained with `.claude/skills/bmad-review/scripts/word_metrics.py`, using `uv run` for each current file. The passage count uses the same script's `word_count` function. Section counts exclude heading text and child sections; document totals include all text counted by the script.

| Document or passage | Exact words |
| --- | ---: |
| Architecture, entire document | 5,572 |
| Architecture, Mutation authority | 615 |
| Architecture, Bounded retry policy passage within Mutation authority | 144 |
| Architecture, Sessions and client lifecycle | 549 |
| API contract, entire document | 4,005 |
| API contract, Global rules | 760 |
| API contract, Admin moderation | 331 |
| Combined documents | 9,577 |

## Findings

| Pass | Original Text | Revised Text | Changes |
| --- | --- | --- | --- |
| structure | Architecture §4, Mutation authority, line 142: the original 144-word paragraph beginning **Bounded retry policy:** contained the transaction-body cap, commit cap, uncertain-outcome handling, client reconciliation, timeouts and cleanup in one block. | **MOVE — addressed and verified.** The coordinator split the existing sentences into four consecutive paragraphs: (1) body attempts, eligible errors and jitter; (2) immediate errors and known outcomes; (3) commit-call cap, unknown-commit retries, client reconciliation and the absence of a rollback guarantee; (4) timeouts, hidden-loop caps and cleanup. The block remains immediately after the transaction-runner paragraph. | The two independent retry budgets and the uncertain-commit exception now have clearer visual separation. Verification compared the revised passage against the original after normalizing whitespace: every sentence and value is unchanged. Word impact: **0 words saved** from this 144-word passage. No further action remains on this finding. |

The correction prose otherwise fits the selected models. The review-status update appears before design details. The API summary repeats transaction outcomes where endpoint implementers need them and links to architecture for the fuller policy; this repetition has reinforcement value. The explicit partial FR-24 coverage appears in review context, traceability and the relevant Admin operation, serving different lookup paths. No cuts or merges are recommended for those passages. The auth additions retain the server-policy-to-client-lifecycle progression; further section splitting is not necessary for this correction scope.

## Reduction and trade-offs

One optional structural recommendation, now addressed and verified; no remaining structural findings. The verified change saves **0 words (0% of either document and 0% of the combined 9,577-word review baseline)**. No length target was provided. It adds whitespace while preserving all content, so it has no identified comprehension trade-off. This review edited only this report; the coordinator applied the source-document formatting change. This editorial result does not replace human review or establish architecture approval.
