# Tasks

## 1. Write the baseline specs

- [x] 1.1 Write `specs/auth/spec.md` from `src/App.jsx`, `src/pages/LoginPage.jsx`, and the navigation; verify every scenario traces to a line of that code and none names a storage key or component
- [x] 1.2 Write `specs/marketplace/spec.md` from the Marketplace page, `src/components/marketplace/`, and the listing services; verify the numbers and strings in its scenarios by running the filtering, statistics, offer-label, and price-format logic in Node and comparing the output
- [x] 1.3 Write `specs/my-books/spec.md` from the My Books page, `src/components/my-books/`, the Add Book page and components, and the library and request services; verify the request-activity and library-book scenarios by running that logic in Node and comparing the output

## 2. Verify

- [x] 2.1 Run `openspec validate baseline-marketplace-mybooks-auth --strict`; verify it exits with code 0 and prints "is valid"
- [x] 2.2 Run `git diff --name-only main`; verify every path starts with `openspec/changes/baseline-marketplace-mybooks-auth/` and no file under `src/`, `public/`, or the project root changed
- [x] 2.3 Run `npm run lint` and `npm run build`; verify both exit with code 0
- [ ] 2.4 Run `npm run dev`, sign in, and walk through each scenario in the three specs on `/marketplace`, `/my-books`, `/add-book`, and `/login`, at 375px and 1280px; verify each one behaves as written, and fix the spec (not the code) wherever it does not

## Workflow follow-up

- Open the pull request as a draft containing only this change; the reviewer (Jorge) approves the spec (Gate 1) before anything else happens.
- Run `/opsx:archive` only after the reviewer approves and 2.4 is done, then push the archive commit to the same pull request.
- Do not add application code to this branch; the change describes current behavior only.
