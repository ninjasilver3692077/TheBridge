# Contributing to TheBridge

TheBridge is built by a four-person academic team. Planning is done (`prd.md`, `architecture.md`, `api-design.md`); AI agents implement, people operate the sessions, decide, and review.

## Team roles

> **Proposed.** These responsibilities are pending confirmation by all four team members; update this table once agreed.

| Person | Human role | Operates the AI agents for |
|---|---|---|
| Juan Esteban González | Coordinator: assigns tasks, merges PRs, talks to the stakeholder | Product Owner (brief, PRD), task planning |
| Edwin Montaño | Technical approver and reviewer | Architect |
| Daniel Orozco | Executor and reviewer | Developer, baseline specs |
| Jorge Fontalvo | Executor and reviewer | Developer, baseline specs |

## The rules

1. One branch per task: `feat/<hw>-<slug>` (for example `feat/hw11-listings-crud`).
2. `api-design.md` is the spec. If the code must differ, update `api-design.md` in the same pull request.
3. Every change enters through a pull request approved by someone other than the author. One review, then merge.

## Task cycle

1. The coordinator opens a GitHub issue with the task card below.
2. The owner creates the branch, implements the task against `api-design.md` and that week's course README, and opens a pull request ready for review.
3. The reviewer reads the diff (optionally with `/code-review`), tests it, and approves on GitHub or requests changes.
4. The coordinator merges once approved.

### Task card (issue template)

```
Task: <HW and title> · Owner: <person> · Reviewer: <person>
Input: <api-design.md operation ids, course README section>
Expected output: <files or folders>
Branch: feat/<hw>-<slug>
Done when: <checks + lint/build pass + deployed URL works>
```

## Review ring

```
Daniel → reviewed by Jorge → reviewed by Edwin → reviewed by Daniel
Juan (brief, PRD, epics) → reviewed by Edwin
Architecture and API contract (Edwin) → approved by Juan and Jorge
```

The reviewer is never the author or the AI session that wrote the code.

## File ownership

Only the owner edits these files; others propose changes through PR comments.

| File | Owner |
|---|---|
| `_bmad-output/planning-artifacts/product-brief.md`, `prd.md` | Juan |
| `_bmad-output/planning-artifacts/architecture.md`, `api-design.md`, `DECISIONS.md` | Edwin |
| `CONTRIBUTING.md`, `README.md` | Juan |

API contract changes are made in `api-design.md` inside the pull request that needs them; Edwin is tagged as reviewer.

## Commits

- Keep commits small and coherent: one logical change per commit.
- Write commit messages in English, in the imperative mood, with a type prefix: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
- Commit from your own GitHub account. The AI writes, but the person who operated the session commits.
- Run `git status` and `git diff` before every commit to confirm only the intended files changed.

## Pull requests

Every pull request targets `main` and includes:

1. The task and the HW it belongs to.
2. The requirements covered (FR/NFR ids).
3. Manual tests performed (states, screen sizes, keyboard navigation).
4. Screenshots for mobile and desktop when the change is visual.

## Verification checklist

- `npm run lint` and `npm run build` pass.
- The screen works at 375px, 768px, 1280px, and 1440px without horizontal scroll.
- Dark mode keeps contrast, borders, icons, and overlays legible.
- Relevant states exist (initial, loading, data, empty, error, validation, success).
- Interactive controls have an accessible name and a visible focus state; `Escape` closes modals.
- No errors appear in the browser console.

## Language and code rules

- Visible interface text and project documentation are written in English.
- Code files contain no comments.

## AI usage

Significant AI assistance is recorded in `AI-LOG.md`: the agent or command used, the task, what was adopted, what people changed afterward, and how the result was verified.
