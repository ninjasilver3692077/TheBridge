# Contributing to TheBridge

TheBridge is built by a four-person academic team using **BMAD** (planning: what and why) and **OpenSpec** (execution: what changes and how it is verified). AI agents play the method roles; people operate the sessions, decide, approve, and review.

## Team roles

| Person | Human role | Operates the AI agents for |
|---|---|---|
| Juan Esteban González | Coordinator: assigns tasks, owns `sprint-status.yaml`, approves sync points, merges PRs, talks to the stakeholder | Product Owner (brief, PRD), planning (epics, sprint) |
| Edwin Montaño | Technical approver and reviewer | Architect |
| Daniel Orozco | Executor and reviewer | Developer, baseline specs |
| Jorge Fontalvo | Executor and reviewer | Developer, baseline specs |

## The four rules

1. One branch per story: `feat/<epic>-<story>-<slug>` (for example `feat/3-1-send-request`).
2. No code is written without a spec approved by another person.
3. Every change enters through a pull request reviewed by someone other than the author.
4. If reality changes, update the document first, not only the code.

## Workflow

| Phase | Tool | Output |
|---|---|---|
| 1. Need | `bmad-product-brief` | `_bmad-output/planning-artifacts/product-brief.md` |
| 2. Plan | `bmad-prd`, `bmad-architecture` | `prd.md` (numbered FR/NFR), `architecture.md` (API contract) |
| 3. Epics | `bmad-create-epics-and-stories`, `bmad-sprint-planning` | Epics, stories, `sprint-status.yaml` |
| 4. Spec | `/opsx:propose` | `openspec/changes/<story>/` (proposal, specs, tasks). No code |
| 5. Apply | `/opsx:apply` | Code that implements `tasks.md` |
| 6. Review | `bmad-code-review` in a fresh session, run by the reviewer | Triaged findings |
| 7. Evaluate | Acceptance criteria + demo, then `/opsx:archive` | Spec merged into `openspec/specs/` |
| 8. Retrospective | `bmad-retrospective` at the end of each epic | Lessons fed back into the PRD |

One story = one OpenSpec change = one branch = one pull request.

### Story cycle

1. The coordinator assigns the story as a GitHub issue using the task card below.
2. The owner creates the branch and runs `/opsx:propose`, then opens a **spec-only** pull request.
3. The assigned reviewer approves the spec or requests changes.
4. The owner runs `/opsx:apply` and opens the code pull request with lint, build, and demo passing.
5. The reviewer runs `bmad-code-review` in a new session, reads the diff, and approves.
6. The owner checks the acceptance criteria and runs `/opsx:archive`.
7. The coordinator merges and marks the story `done` in `sprint-status.yaml`.

### Task card (issue template)

```
Story: <id and title> · Owner: <person> · Reviewer: <person>
Agent/command: <for example /opsx:propose, then /opsx:apply>
Input: <prd.md FR-xx, architecture.md API section, story in epics.md>
Expected output: <files or folders>
Branch: feat/<epic>-<story>-<slug>
Done when: <acceptance criteria + lint/build + openspec validate>
```

## Review ring

```
Daniel → reviewed by Jorge → reviewed by Edwin → reviewed by Daniel
Juan (brief, PRD, epics) → reviewed by Edwin
Architecture and API contract (Edwin) → approved by Juan and Jorge
```

The reviewer is the person who runs `bmad-code-review`, so neither the author nor the AI session that wrote the code reviews it.

## File ownership

Only the owner edits these files; others propose changes through PR comments.

| File | Owner |
|---|---|
| `_bmad-output/planning-artifacts/product-brief.md`, `prd.md`, epics, `sprint-status.yaml` | Juan |
| `_bmad-output/planning-artifacts/architecture.md`, `DECISIONS.md` | Edwin |
| `CONTRIBUTING.md`, `README.md` | Juan |

Changes to the API contract go through a pull request to `architecture.md` before any code changes.

## Commits

- Keep commits small and coherent: one logical change per commit.
- Write commit messages in English, in the imperative mood, with a type prefix: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
- Commit from your own GitHub account. The AI writes, but the person who operated the session commits.
- Run `git status` and `git diff` before every commit to confirm only the intended files changed.

## Pull requests

Every pull request targets `main` and includes:

1. The story and the OpenSpec change it implements.
2. The requirements covered (FR/NFR ids).
3. Manual tests performed (states, screen sizes, keyboard navigation).
4. The `bmad-code-review` summary for code pull requests.
5. Screenshots for mobile and desktop when the change is visual.

## Verification checklist

- `npm run lint` and `npm run build` pass.
- `openspec validate` passes before `/opsx:archive`.
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
