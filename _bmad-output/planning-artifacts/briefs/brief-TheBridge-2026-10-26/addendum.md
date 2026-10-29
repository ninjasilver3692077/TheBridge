---
title: "Product Brief Addendum: TheBridge"
status: final
created: 2026-10-26
updated: 2026-10-26
---

# Addendum: Milestone 3 rubric (weeks 11–15)

Source: course assignments HW11–HW15, supplied by Juan on 2026-10-26. This is input for the PRD (FR/NFR) and the architecture document (issue #9).

| Week | Assignment | Graded requirements | Layer 2 |
|---|---|---|---|
| 11 | Express REST API | `api-design.md` written before code; `routes/` with full CRUD for the main entity; correct HTTP methods; error body `{ error: string, code: number }` on every endpoint; in-memory data; `deployment.txt` URL returns 200 | Pagination on GET all: `?page=1&limit=10` |
| 12 | MongoDB + Mongoose | `models/` with at least 2 related models; `required` and `enum`/`minlength`/`maxlength` validation; invalid data returns 400, never 500; `.env.example`; `.env` ignored; data persisted on Atlas | An endpoint that uses `populate()` to return related data |
| 13 | Full-stack + auth | `POST /api/auth/register` (bcrypt hash), `POST /api/auth/login` (returns JWT); `authMiddleware` reading `Authorization: Bearer`; at least one endpoint returns 401 without a token; token kept in `localStorage`; two roles stored in the database and in the JWT payload, each with different actions, sections, or data; no mock data files, everything from the API; CORS limited to the frontend domain | Detect JWT expiry and redirect to login |
| 14 | TypeScript | `tsconfig.json` with `strict: true`; `src/types.ts` with at least 2 entity interfaces imported by both client and server; 3 client components in `.tsx` with typed props; 2 server route files in `.ts` with typed `Request`/`Response`; no `any`; `tsc --noEmit` passes | Path alias `@/types` |
| 15 | Security + final deploy | `security-audit.md` with justification for XSS, NoSQL injection, CORS, server-side validation, environment variables, helmet; `helmet()` in Express; final public URL used on Demo Day | `express-rate-limit` on auth endpoints |

Every week: ESLint passes with no errors, `AI-LOG.md` answers that week's questions, and the project is deployed and public on Vercel, or it cannot be graded.

## Conflicts with the current repository

- Hosting moves from GitHub Pages to Vercel (client and server). `AGENTS.md`, `DECISIONS.md`, `README.md`, the `/TheBridge/` base path, and `npm run deploy` need updating.
- The autograder looks for `routes/`, `models/`, `api-design.md`, `deployment.txt`, `.env.example`, `tsconfig.json`, and `src/types.ts`. Their location relative to the planned `client/` and `server/` split must be settled in the architecture document.
- `api-design.md` is a separate graded file; the architecture document can own the contract and `api-design.md` can mirror it, or the reverse.
- "No mock data" removes `src/data/listings.js`, `myBooks.js`, and `requests.js` as runtime data; they can become a server seed script. `navigation.js` and `aboutContent.js` are UI content and their treatment should be confirmed.
- The mock login in `LoginPage.jsx` is replaced by real register and login.
