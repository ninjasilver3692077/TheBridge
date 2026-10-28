# Human-feedback corrections: technology and reality gate

Date: 2026-10-28.

**Verdict: PASS for this documentation correction.** No blocking technology or feasibility finding was introduced. This is an internal artifact check, not formal review approval, human risk acceptance or backend implementation evidence.

## Scope and evidence

Reviewed the supplied `corrections.diff`, companion architecture sections 4–6 and 9–10, canonical API contract sections 1–3, and spine AD-5/AD-6 and stack. Compared the version declarations with HEAD and the dated [technology baseline](gate-technology.md). The current branch is `docs/architecture`; package manifests and lockfile have no diff. Only this report was written by this check.

Primary documentation was read live on 2026-10-28 for the changed transaction and authentication decisions. Registry versions, runtime releases and advisories were not refreshed; their retained evidence date is 2026-10-27.

## Changed-decision checks

| Item | Assessment |
| --- | --- |
| Transaction runner and retries | Supported. MongoDB's Core API makes the application responsible for session lifecycle and error handling. Retrying the body for `TransientTransactionError` and only the commit for `UnknownTransactionCommitResult` follows the documented distinction. The three body attempts, 25–100 ms jitter and three commit calls are application policy, not driver defaults. The documents correctly prohibit wrapping this runner in automatically retrying helpers. [MongoDB Node transactions](https://www.mongodb.com/docs/drivers/node/current/crud/transactions/). |
| Unknown commit outcome | Correctly distinguished from a confirmed conflict. Exhausted uncertainty produces sanitized 503, preserves the same commit identity and forbids automatic body replay or a rollback promise. Cleanup is qualified to abort confirmed-uncommitted work. Refetch/reconciliation is a required application behavior, not a guarantee that the first read proves the outcome. [MongoDB transaction error handling](https://www.mongodb.com/docs/manual/core/transactions-in-applications/). |
| Mongoose integration | Feasible. Mongoose exposes driver sessions; its `Connection#transaction()` wraps `withTransaction()` and resets tracked document state after rollback. The proposed Core API path deliberately avoids that helper, requires fresh reads/plain results, and keeps operations sequential on the same session. This avoids relying on helper-specific change tracking or unsupported transaction parallelism. [Mongoose transactions](https://mongoosejs.com/docs/transactions.html). |
| JWT startup and expiry | Correct. jsonwebtoken interprets numeric `expiresIn` values as seconds, while a bare numeric string uses milliseconds. Passing parsed number `86400` prevents that unit error. Exact TTL, secret rejection rules and explicit issuer/audience/algorithm checks are application requirements; they are not claimed library defaults. Secret length is correctly distinguished from entropy. [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken). |
| Absent-account login | Supported. bcryptjs exposes asynchronous `compare` and cost inspection. One valid dummy hash at the configured cost, provisioned once and always followed by rejection for an absent account, is a feasible application mitigation. The text appropriately avoids claiming perfect timing equality. Async hashing and rejection above 72 UTF-8 bytes remain consistent with the library. [bcryptjs](https://github.com/dcodeIO/bcrypt.js). |
| LibraryBook counters and auth/public boundary | No new technology is needed for separate conditional internal revision and public domain version, server-owned rejection enums, public routes ignoring bearer identity, or ADMIN-05 body validation. These are explicit contract/application policies; the documentation does not claim MongoDB, Express or JWT supplies them automatically. |

## Version and scope preservation

The retained baseline is unchanged: Node 24.22.1 authoring target; React/React DOM 19.3.0, React Router 6.30.6 and Vite 8.3.1; proposed Express 5.3.0, Mongoose 9.11.4, jsonwebtoken 9.0.3, bcryptjs 3.0.3, TypeScript 7.0.2, helmet 8.3.0, express-rate-limit 8.7.1, cors 2.8.6 and dotenv 18.0.9. API `version: 3` is a contract revision. No dependency upgrade or new framework, persistence or hosting choice appears in this correction.

## Findings and remaining evidence

No required correction from this lens. The retry counts bound application attempts/calls, not an asserted number of low-level network packets. Finite driver timeouts and the deployed request budget still require concrete configuration and failure-injection tests in the implementation story. Those tests must prove bounded retries, no body replay after uncertain commit, safe session cleanup, numeric JWT expiry and an absent-account comparison. The document already labels these as future evidence.

This pass does not approve the localStorage residual risk, resolve the merge-dependent issue #15 contract gaps, or substitute for Juan/Jorge review of the updated revision.
