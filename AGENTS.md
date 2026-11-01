## Team policies

Agreed collaboration rules. They live outside the managed block so context refreshes never replace them; change them only through a reviewed pull request.

- `api-design.md` is the spec: implement what it says. No OpenSpec proposal, epics or sprint file is required before code.
- One branch and one pull request per task, `feat/<hw>-<slug>` (for example `feat/hw11-listings-crud`); never commit to `main`. Spec changes and code travel together in that pull request.
- One review per pull request: someone other than the author reads the diff and approves on GitHub before the coordinator merges. Never review your own change.
- When the implementation must differ from `api-design.md`, update `api-design.md` in the same pull request and say so in its description.
- Never add comments to code files (course requirement); express intent through naming instead.
- Never modify or replace `public/assets/brand/thebridge-logo.svg` or `public/assets/hero/find-your-bridge.webp` without team agreement.
- Only the coordinator runs `npm run deploy`, from an up-to-date `main`; it publishes straight to GitHub Pages.
- Write visible UI text and documents in English; communicate with the team in Spanish.
- Read and write domain data (listings, requests, my-books, favorites, auth) only through `src/services/*`; components and hooks never call `localStorage` or `fetch` directly. The theme preference in `src/components/AppShell.jsx` is the allowed exception.

## Starting a session

People state the goal in plain language (an issue number, "apply 0-1", "review Daniel's pull request", "what's next?"); the agent picks and runs the commands.

- Start with `git status` and `git fetch`. For new work, update `main` and create the branch named in the issue; to continue or review, switch to the existing branch. Never work on `main`.
- Read the issue with `gh issue view <number>` (or ask the person to paste it) and follow its task card.
- Implement the issue directly against `api-design.md` and the course README for that week; to review someone else's pull request, read its diff (optionally with `/code-review`).
- If the goal is unclear, check the open issues and the next HW deadline and propose the next step.
- Commit locally from the person's account, but never push or open pull requests; give the person the exact commands to run.

<!-- bmad:context -->
<!-- Verified 2026-10-24 against 71d9524. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## TheBridge

Community book marketplace (Exchange, Loan, Rental, Sale) for small academic communities. React 19 + Vite + React Router v6 client deployed to GitHub Pages; an Express server is planned. BMAD planning artifacts live in `_bmad-output/planning-artifacts/`, living behavior specs in `openspec/specs/`, team roles and the review ring in `CONTRIBUTING.md`.

## Conventions that differ from defaults

- Tailwind runs from the CDN with its config inline in `index.html`; add design tokens there, never install Tailwind/PostCSS or create `tailwind.config.js`.
- Prefix `public/` asset URLs with `import.meta.env.BASE_URL`, and build links with React Router; the app is served under `/TheBridge/`, so absolute paths break in production.

## Known pitfalls

- Never create or commit files with a ` 2` suffix (e.g. `useListingForm 2.js`); they are iCloud sync conflict copies and two were already committed.
- `src/App.jsx`, `src/pages/LoginPage.jsx`, and `src/hooks/useMarketplace.js` still touch `localStorage` directly; do not copy that pattern, it is scheduled to move into services.

<!-- /bmad:context -->
