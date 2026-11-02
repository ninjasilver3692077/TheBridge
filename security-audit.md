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

- Atlas network access is open to `0.0.0.0/0`. Vercel serverless functions have no fixed outbound IP, so an IP allowlist cannot be used.
- This is compensated with a dedicated database user that has least privilege: the `readWrite` role on the application database only, with no `atlasAdmin` and no access to other databases. The connection string lives only in the `MONGODB_URI` Vercel environment variable and in the local `.env`, which is git-ignored.
- Residual risk: the database is reachable from any IP, so the strength of that user's password is the only barrier. Use a long random password and rotate it if it is ever exposed.

## 6. Token in localStorage

- The session token (JWT) is stored in `localStorage` through the auth storage service and sent as `Authorization: Bearer`.
- Benefit: no cookies, so no CSRF.
- Risk: any script running on the page can read `localStorage`, so a cross-site scripting (XSS) flaw would expose the token. Mitigations in place: React escapes rendered text, there is no `dangerouslySetInnerHTML`, tokens expire, and the client clears the session on any `401`.
- Not mitigated: there is no refresh-token rotation and no server-side revocation. This residual risk is recorded in `DECISIONS.md` and is accepted for the scope of the course.

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
- [ ] `npm run lint`, `npm run typecheck` and `npm run build` pass on the merged `main`.
