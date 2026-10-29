# Technology verification gate

Date: 2026-10-27. Scope: latest `ARCHITECTURE-SPINE.md`, companion `_bmad-output/planning-artifacts/architecture.md`, root `api-design.md`, current package manifest/lock and relevant client boundaries. This is an internal artifact review, not Juan/Jorge approval, an implementation test, or deployment evidence.

**Verdict: PASS for technology fit and version accuracy.** No critical/high technology mismatch was found. Proposed server dependencies and layout are clearly distinguished from the installed frontend. Hosting, shared rate limiting and persistence remain implementation gates.

## Version and repository reality

| Item | Independently checked result | Assessment |
| --- | --- | --- |
| React / React DOM | Lockfile resolves both to 19.3.0; manifest begins at ^19.2.8 | Correctly documented; the range is not confused with the resolved version. |
| React Router / Vite | Lockfile resolves 6.30.6 / 8.3.1 | Correctly documented. |
| Express / Mongoose | Registry latest 5.3.0 / 9.11.4; Node requirements >=18 / >=20.19.0 | Correct proposed seeds; Node 24 satisfies both. |
| JWT / bcryptjs | Registry latest jsonwebtoken 9.0.3 / bcryptjs 3.0.3 | Correct proposed seeds. |
| TypeScript / Helmet / limiter | Registry latest 7.0.2 / 8.3.0 / express-rate-limit 8.7.1 | Correct proposed seeds. |
| cors / dotenv | Registry latest 2.8.6 / 18.0.9 | Correct in companion architecture. |
| Node | Official release index identifies 24.22.1 as latest 24.x; local executable reports 24.19.0 | Architecture states both accurately and does not claim a local upgrade. |
| Server / shared layout | `client/`, `server/`, root `routes/`, `models/`, `src/types.ts`, `api/index.js`, `vercel.json`, `tsconfig.json` do not exist yet; server/TypeScript packages are absent from lockfile | Expected for this documentation proposal; target paths are explicitly future work. |

Registry results were fetched directly from `https://registry.npmjs.org/<package>/latest`; no dependencies or runtime settings were changed. Node evidence: [official release index](https://nodejs.org/download/release/index.json).

## Technology fit

- **MongoDB constraints are expressible.** The required active-state unique indexes can use partial filters with status membership and an ObjectId type check for optional offered copies. The document correctly requires explicit index bootstrap and duplicate-key handling rather than treating Mongoose `unique` as validation. [MongoDB partial indexes](https://www.mongodb.com/docs/manual/core/index-partial/).
- **Transactions use the supported model.** A compatible Atlas replica-set deployment, one session across all operations, sequential operations, conditional writes and database contention are coherent choices. The plan does not rely on standalone MongoDB or process-local locks. Database transactions alone do not prove every transition implementation correct; concurrency evidence remains required downstream. [MongoDB transaction deployment requirements](https://www.mongodb.com/docs/manual/core/transactions-production-consideration/), [Mongoose transactions](https://mongoosejs.com/docs/transactions.html).
- **Vercel supports the chosen major and function boundary.** Managed Node 24.x is available; a separate fixed patch is not promised. Root `api/index` as the single imported function plus external route/model modules is compatible with Vercel's shared-function guidance and the existing ESM package. [Supported Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [Node runtime](https://vercel.com/docs/functions/runtimes/node-js), [Express on Vercel](https://vercel.com/docs/frameworks/backend/express).
- **Static/client routing is a proposal with an appropriate acceptance gate.** No untested `vercel.json` recipe is represented as working. API path/query preservation, API JSON misses, static assets and SPA deep links must still be demonstrated together in the later hosting story. Keep static build output under Vercel's static handling; Express static middleware is not a substitute. [Vercel rewrites](https://vercel.com/docs/routing/rewrites), [Express static asset limitations](https://vercel.com/docs/frameworks/backend/express).
- **Root shared types avoid a real deployment trap.** Real graded root modules and type-only `@/types` imports preserve one DTO owner without depending on runtime path mappings. Relative server runtime imports match the documented Vercel limitation. The explicit root `typecheck` script remains necessary in HW14. [Vercel TypeScript support](https://vercel.com/docs/functions/runtimes/node-js).
- **Authentication choices match the selected libraries.** Explicit HS256/issuer/audience/expiry verification, stored-role authorization and async bcrypt hashing are supported. Rejecting more than 72 UTF-8 bytes avoids bcrypt truncation. No code currently claims these controls exist. [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), [bcryptjs](https://github.com/dcodeIO/bcrypt.js).

## Findings and disposition

No required technology correction in this lens. Do not convert the pass into evidence that backend routes, schemas, index migrations, JWT middleware, shared limiting, deployed routing or course submissions already pass. The proposal already preserves those distinctions.

The request-creation versus listing-transition race belongs to the domain-consistency lens: a transaction must contend on the listing as well as relevant copies when enforcing its availability/version. Technology verification confirms MongoDB can enforce such guards; it does not replace that transition review.
