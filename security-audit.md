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

- JSON bodies are limited to 32 KB (`express.json`), and `requireJsonBody` answers `415` to any request that has a body but is not `application/json`. Requests that declare `Content-Length: 0` (for example `DELETE /api/favorites/:id`) are allowed, because they carry no body to parse.
- Errors go through one handler in `server/errors.ts` that returns `{error, code}` and does not expose stack traces, database details or tokens.
- Database unavailability is reported as `503` without the connection string.

## 5. MongoDB Atlas access

- Required configuration: Atlas network access opened to `0.0.0.0/0`, because Vercel serverless functions have no fixed outbound IP and an IP allowlist cannot be used.
- Required compensation: a dedicated database user with least privilege, the `readWrite` role on the application database only, with no `atlasAdmin` and no access to other databases. The connection string must live only in the `MONGODB_URI` Vercel environment variable and in the local `.env`, which is git-ignored.
- Verified by the coordinator in Atlas: Network Access lists `0.0.0.0/0`, and the application user holds `readWrite` on the `thebridge` database only. With that role, `GET /api/listings` on the deployed app returns `200` (checked on 2026-11-13), so reads work, and registering an account through the deployed app succeeds, so writes work too. No credentials or connection string are recorded in this repository.
- Lesson from the first attempt: an earlier privilege setting made every database query fail with `500` while `GET /api/health` kept returning `ok`, because that route only checks the connection. After changing the Atlas user, verify with a data endpoint such as `GET /api/listings`, not with `/api/health`.
- Residual risk: while the database is reachable from any IP, the strength of that user's password is the only barrier. Use a long random password and rotate it if it is ever exposed.

## 6. Token in localStorage

- Design: `POST /api/auth/login` and `/register` return a session `{token, expiresAt, account}`. `src/services/authStorage.js` keeps it in `localStorage` under `thebridge:session`, and `src/services/apiClient.js` sends the token as `Authorization: Bearer`.
- Transport: apiClient sends the Bearer header explicitly. Authentication does not use automatically attached session cookies; this does not protect against XSS.
- Risk: any script running on the page can read `localStorage`, so a cross-site scripting (XSS) flaw would expose the token.
- Mitigations in place:
  - React escapes rendered text and the client has no `dangerouslySetInnerHTML`.
  - Tokens last 24 hours (`JWT_TTL_SECONDS` must be `86400`; the value is validated when a session is issued, so any other value makes login and registration answer `500` while the server still starts). The client expires the session when `expiresAt` passes, on tab focus, and on any `401` from an authenticated request, then redirects to login.
  - The server re-reads the account on every authenticated request, so a deleted account loses access immediately and a role change applies on the next call.
  - A session change in another tab or a re-login reloads the private data (My Books, Requests, favorites) for the new account and discards in-flight responses of the previous one.
  - Authenticated responses are sent with `Cache-Control: no-store`.
- Not mitigated: there is no refresh-token rotation and no server-side revocation, so a stolen token works until it expires.
- Decision tracking (issue #53): `DECISIONS.md` now contains a concrete proposal to retain localStorage for the academic delivery, its rationale, current controls, the HttpOnly-cookie alternative and an acknowledgement table. Status: proposed on 2026-11-17; Juan and Jorge must state their positions in the PR and Daniel must review it. Team acceptance and the acceptance date remain pending. Once the required acknowledgements exist, update both documents with the actual names, dates and evidence before closing #53.

## 7. Authentication and authorization

- Passwords are hashed with `bcryptjs`. Login compares against a dummy hash when the email does not exist, so response time does not reveal which accounts exist.
- Tokens are signed with `jsonwebtoken` (HS256, algorithm pinned on verification). `JWT_SECRET` must be at least 32 bytes; a shorter value makes authenticated routes fail with `500` instead of signing weak tokens.
- `requireAuth` answers `401` for a missing, malformed, expired or unknown-account token, with one of two generic messages: `Authentication required.` when the Bearer header is missing or malformed, and `Invalid or expired session.` when the token is invalid or expired or the account is unknown.
- Roles are `Member` and `Admin`. Registration always creates a `Member`; the first Admin is created with `npm run bootstrap:admin`, which is not reachable over HTTP.
- Every `/api/admin/*` route is mounted behind `requireRole("Admin")`, and a Member receives `403`.
- Removing a listing requires a reason (maximum 500 characters), which is stored with the removal.
- Residual risk: login and register are rate limited (section 1), but authenticated endpoints are not, so a valid token can call the API without a request cap.

## 8. Final deployment check

Run against https://thebridge-sepia.vercel.app. Items marked done were checked on 2026-11-12 with `curl` against the deployed `main` (which includes #30 and #31); #32 (Admin screen) was not merged yet.

- [x] `GET /api/health` returns 200 with `{"data":{"status":"ok"}}`; the route requires the database, so a `503` would show it down.
- [x] An unknown `/api/...` path returns the JSON 404 envelope, not HTML.
- [x] A request with a foreign `Origin` header returns 403.
- [ ] The 11th login attempt within 15 minutes returns 429.
- [x] Response headers include `Strict-Transport-Security` and `X-Content-Type-Options`.
- [x] A Member token receives 403 on `/api/admin/overview`; an Admin token receives 200. Without a token the route returns 401. Confirmed by the coordinator on 2026-11-13 against the deployed app.
- [x] Atlas Network Access lists `0.0.0.0/0` and the application user has only `readWrite` on one database (section 5); reads confirmed on 2026-11-13.
- [x] With that role, registering an account through the deployed app succeeds (confirms writes), confirmed by the coordinator on 2026-11-13.
- [x] `npm run lint`, `npm run typecheck` and `npm run build` pass on the merged `main`, and the 46 unit tests pass (checked on 2026-11-15).

## 9. Milestone 4 password recovery (issue #37)

- POST /api/auth/forgot-password accepts a normalized email and returns the same 200 message for known and unknown accounts, including email-delivery failure. It does not confirm that a message arrived. Invalid payloads return 400.
- POST /api/auth/reset-password accepts a token and newPassword. Invalid, expired, superseded or reused tokens return the same 400 message. Both endpoints have independent limits of 10 requests per IP per 15 minutes, and responses carry Cache-Control: no-store. The instance-local limitation in section 1 also applies here.
- Tokens use 32 random bytes from node:crypto. Only a SHA-256 hash and a one-hour expiry are stored, in hidden Account fields. Expiry is checked during the conditional password update. A sparse index supports token-hash lookups. Consuming the token and replacing the bcrypt password hash are one atomic write, including under concurrent use.
- A new request replaces the previous token. On delivery failure only that token is cleared. Errors use a fixed log message that excludes email, token, credentials and provider details.
- Reset links use the trusted APP_URL, require HTTPS outside localhost, and carry the token in the fragment. The page holds it in memory and replaces the URL to remove the fragment. Reset POST bodies carry the token. Tokens are never stored in localStorage or returned by the API. Do not enable body logging for these endpoints or link tracking for recovery email in the provider.
- Resend is called over HTTPS with RESEND_API_KEY and MAIL_FROM. The coordinator owns the provider account and Vercel variables. A verified sending domain is needed for general recipients. The resend.dev testing sender may deliver only to the provider account's own address. API acceptance alone does not establish inbox delivery. [Resend API](https://resend.com/docs/api-reference/emails/send-email), [testing sender limits](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).
- Residual risks include email inbox compromise, XSS reading the token while the page is open, delivery delays/failures, and timing differences between registered and unknown addresses. Recovery throttling is per IP. Someone who knows an account email can repeatedly request links, invalidate the recipient's previous link and send unwanted emails, particularly across multiple IPs. Account-level cooldowns remain a future mitigation. Existing JWTs on other devices remain valid until expiry. A successful reset clears the local browser session, without issuing another token.

### Preview verification for #37

- [x] Coordinator configured RESEND_API_KEY, MAIL_FROM and APP_URL in Production and Preview on 2026-11-15. The sender is `onboarding@resend.dev`, a Resend testing sender with no verified domain of our own.
- [x] A real reset email arrived for a controlled Member account on https://thebridge-sepia.vercel.app on 2026-11-15. Recipient limitation: the resend.dev sender delivers only to the Resend account's own address.
- [x] Opening that email changed the password, the new password logged in, the old password failed, and the link could not be reused (2026-11-15).
- [x] A second recovery email superseded the first link (2026-11-15).
- [ ] An expired link is refused.
- [ ] A controlled Admin account can also recover its password.
- [ ] The 11th attempt receives 429. Confirm the identical response for an unknown email.

Local automated checks use a mail double and a real temporary MongoDB replica set. They verify hashing, expiry, reuse, concurrency, delivery failure cleanup and the uniform response. Live email verification remains in the checklist above.
