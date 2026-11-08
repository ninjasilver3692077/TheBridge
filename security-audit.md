# Security audit

Scope: the TheBridge Express API (`server/`, `routes/`) and the React client, deployed together on Vercel. Each control below states what is in place, where it lives, and the residual risk.

## 1. Rate limiting

- `express-rate-limit` is applied in `server/app.ts` to the two credential endpoints: `POST /api/auth/login` (10 attempts per 15 minutes) and `POST /api/auth/register` (5 per 15 minutes), keyed by client IP.
- `trust proxy` is set to 1 so the limiter sees the real client IP behind Vercel's proxy instead of the proxy address.
- A limited client receives `429` with the standard `{error, code}` envelope and `RateLimit` headers (`draft-8`).
- Residual risk: the default memory store is per serverless instance, so the effective limit on Vercel is looser than the configured number. Acceptable for a course project; a shared store (for example Redis) would be needed to enforce a global limit.

## 2. Security headers (helmet)

- `helmet()` is mounted in `server/app.ts` with its defaults: `X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`, a restrictive `Content-Security-Policy` for API responses and removal of `X-Powered-By`.
- These headers protect API responses. The static client is served by Vercel and does not pass through Express.
- Residual risk: the client HTML has no explicit CSP, because Tailwind runs from the CDN with its configuration inline in `index.html`. Adding a CSP would require pinning that script.

## 3. CORS allowlist

- `server/app.ts` only accepts browser origins listed in the `CLIENT_ORIGINS` environment variable (comma separated). Any other `Origin` receives `403`.
- Requests without an `Origin` header (same-origin calls, curl, health probes) are allowed, because CORS only constrains browsers.
- No wildcard origin and no credentials mode: authentication uses a bearer header, not cookies, so cross-site request forgery does not apply.
- Residual risk: an empty `CLIENT_ORIGINS` rejects every browser origin. The deployment check below confirms it is set on Vercel.

## 4. Request hardening

- JSON bodies are limited to 32 KB (`express.json`), and `requireJsonBody` rejects mutating requests that are not JSON.
- Errors go through one handler in `server/errors.ts` that returns `{error, code}` and does not expose stack traces, database details or tokens.
- Database unavailability is reported as `503` without the connection string.

## 5. MongoDB Atlas access

- Required configuration: Atlas network access opened to `0.0.0.0/0`, because Vercel serverless functions have no fixed outbound IP and an IP allowlist cannot be used.
- Required compensation: a dedicated database user with least privilege, the `readWrite` role on the application database only, with no `atlasAdmin` and no access to other databases. The connection string must live only in the `MONGODB_URI` Vercel environment variable and in the local `.env`, which is git-ignored.
- Verification pending: the coordinator has not yet confirmed either setting in Atlas. Non-sensitive evidence (a screenshot of the Network Access list and of the user's role, with no credentials) is to be attached here once checked.
- Residual risk: while the database is reachable from any IP, the strength of that user's password is the only barrier. Use a long random password and rotate it if it is ever exposed.

## 6. Token in localStorage

- Planned design: the session token (JWT) is stored in `localStorage` through an auth storage service and sent as `Authorization: Bearer`. `src/services/authStorage` does not exist yet; `LoginPage.jsx` and `App.jsx` still use the prototype's local flag. Pending #22 and #25.
- Benefit: no cookies, so no CSRF.
- Risk: any script running on the page can read `localStorage`, so a cross-site scripting (XSS) flaw would expose the token.
- Mitigations in place today: React escapes rendered text and there is no `dangerouslySetInnerHTML`.
- Mitigations pending (#22/#25): token expiry and clearing the session on any `401`. This section is updated with evidence once they exist.
- Not mitigated: there is no refresh-token rotation and no server-side revocation.
- Risk acceptance: `DECISIONS.md` records this as a residual XSS risk for reviewer acknowledgement, not as recorded team acceptance. No team decision accepting it exists yet; it remains open until the team records one.

## 7. Authentication and authorization (pending the auth merge)

- Passwords are hashed with `bcryptjs`; tokens are signed with `jsonwebtoken`; roles are `Member` and `Admin`, and Admin operations require `requireRole("Admin")`.
- This section is completed after the accounts and auth change (issue #22) merges, because `server/auth.ts` is not on `main` yet.

## 8. Final deployment check

To run against https://thebridge-sepia.vercel.app once the M3 branches are merged:

- [ ] `GET /api/health` returns 200 and the database is reported ready.
- [ ] An unknown `/api/...` path returns the JSON 404 envelope, not HTML.
- [ ] A request with a foreign `Origin` header returns 403.
- [ ] The 11th login attempt within 15 minutes returns 429.
- [ ] Response headers include `Strict-Transport-Security` and `X-Content-Type-Options`.
- [ ] A Member token receives 403 on `/api/admin/overview`; an Admin token receives 200.
- [ ] Atlas Network Access lists `0.0.0.0/0` and the application user has only `readWrite` on one database (section 5).
- [ ] `npm run lint`, `npm run typecheck` and `npm run build` pass on the merged `main`.
