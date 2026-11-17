# Project Decisions

## Milestone 2 scope (historical)

These restrictions applied to Milestone 2, the React frontend prototype, and describe the app as delivered on GitHub Pages.

- Milestone 2 is a frontend React prototype only.
- The prototype uses simulated data and local frontend state.
- Backend, database, real authentication, payments, chat, notifications, persistence, transactions, administration, and geolocation were outside the Milestone 2 scope.

## Upcoming phase: full-stack (React + Express)

- The next phase adds an Express server alongside the React client, organized as `client/` and `server/`.
- The client keeps reading and writing domain data only through its service modules, so each service can move from `localStorage` to the API without touching components.
- Persistence, authentication, the API contract, and deployment are proposed for review in `_bmad-output/planning-artifacts/architecture.md` and root `api-design.md`; they become agreed decisions only after Juan and Jorge approve issue #9.
- Payments, chat, notifications, and geolocation stay out of scope unless the PRD adds them.

## Issue #9 architecture proposals (pending Juan and Jorge approval)

- Use a layered Express monolith with MongoDB Atlas/Mongoose, JWT/bcrypt authentication and the existing React client; course requirements fix these technologies.
- Root `api-design.md` is the canonical REST contract. Architecture owns boundaries and rollout and links to that contract instead of maintaining a second endpoint definition.
- Keep real server `routes/` and `models/` at the repository root and one shared `src/types.ts`, matching the supplied rubric. `client/` owns React and `server/` owns app composition, domain services and repositories; no duplicate modules or grading facades.
- Bootstrap Admin with an explicit idempotent offline command and one-off environment secrets; registration always creates Member and no HTTP promotion endpoint exists.
- Reserve/close publications through conditional, versioned transactions and active-state unique indexes; client state never authorizes ownership or status changes.
- Bound transaction execution to three body attempts and three commit calls per transaction; unknown commits are reconciled without replaying the body. Copy contention uses internal revision independently of the public domain version used by If-Match.
- Contract version 3 records server-owned rejection reasons, public bearer-header handling, JWT startup validation, dummy login comparison and required moderation reason validation. Client-token storage has an explicit residual XSS risk; the proposed decision and acknowledgement record are tracked in the Issue #53 entry below.
- Target one Vercel origin with API routing before SPA fallback. A later approved hosting story changes `/TheBridge/`, deployment scripts and coordinator-owned documentation; this proposal leaves the current app untouched.
- PRD #13 at e8545a2 confirms the product requirements recorded in A-4/A-5 and fixes collection pagination at 10 by default. Architecture interpretations A-1–A-3 still need confirmation. Q-1 gates Reserved moderation: FR-24 now rejects Accepted requests, but returning a Lent copy to Available still needs a physical-return policy; repeated removal must not release a newer listing's copy. Actual origins, limiter infrastructure, demo data and grading-root confirmation remain owned follow-up gates.

Newer PRD decisions at a1fc15f remain unmerged. Issue #15 owns their reconfirmation/Reserved-moderation/completion contract reconciliation after PR #13 merges; FR-24 is explicitly partial until that work. Juan requested changes and Jorge approved PR #14 at 9f12986; the revised contract requires both reviewers to assess the updated content. No backend implementation is authorized by those earlier review states.

These proposals are documentation for review, not proof of implementation, deployment, human approval or completed course grading.

## Stack

- Milestone 2: React, React Router v6, Vite, and Tailwind CSS (from the CDN).
- Upcoming phase: Express for the server; further libraries are decided in the architecture document.
- Keep dependencies focused and avoid unnecessary libraries or framework changes.
- Figma Make is the visual and behavior reference, not the final implementation stack.

## Product

- TheBridge connects students who own physical books with students who want access to them.
- Supported sharing modalities are Exchange, Loan, Rental, and Sale.
- Exchange is a preference. A listing may be published without a specific desired book and may display "Open to offers."
- Initial delivery and interaction are assumed to happen in person within a small academic community.

## Language

- Visible interface text and project documentation are written in English.
- Code files contain no comments.

## Collaboration

- Work follows BMAD (planning) and OpenSpec (specs and implementation); see `CONTRIBUTING.md`.
- One branch and one pull request per story; the spec is approved before any code is pushed.
- Every team member must make a meaningful functional or documentation contribution from their own account.
- Every pull request is reviewed by a team member other than its author before merging.

## Issue #53: Session token storage for the academic delivery

**Status:** Proposed on 2026-11-17 by Edwin (AndresMonca). Required acknowledgements and independent review are pending. This entry records the proposal, not team risk acceptance.

### Proposed decision and rationale

Keep the existing JWT in localStorage under thebridge:session through src/services/authStorage.js for this course delivery. src/services/apiClient.js reads the session and explicitly sends the Bearer header. This preserves the current React SPA and the course/architecture token-storage profile while Express runs on Vercel. Vercel serverless does not require localStorage and supports cookie-based designs; compatibility with the delivered contract and the academic scope motivate this proposal.

### Residual risk and existing controls

Any JavaScript executing in the application origin can read the token. An XSS flaw or compromised third-party script can steal it and act as that account. OWASP recommends avoiding session identifiers in localStorage because JavaScript can access them; this proposal requires an explicit, limited course-delivery exception rather than a claim that localStorage is safe. See [OWASP HTML5 local storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage).

The current implementation reduces exposure as follows:

- React renders user text as text and the client has no dangerouslySetInnerHTML. The deployed application uses HTTPS. Client CSP hardening remains outside the controls currently in place, as security-audit.md section 2 records.
- Issued sessions expire after 24 hours. The client observes expiry and clears its session on logout or expiry; the server verifies the JWT and reloads the account for authorization. Deleting an account prevents further authenticated use of that account.
- authStorage increments the session generation on login/logout/expiry. apiClient rejects stale authenticated responses when the generation changed, while account-aware hooks refresh private data. This limits late-response crossover between sessions; it does not prevent token theft.
- Private API responses use Cache-Control: no-store. Passwords and reset secrets are not stored with the session.

A stolen JWT can remain usable until expiry while its account exists. Logout, changing a password and password recovery do not revoke copies already held on another device. There is no refresh-token rotation or general server-side token revocation. The existing controls do not remove the residual XSS or compromised-browser risk.

### Alternative considered

A Secure, HttpOnly cookie could prevent JavaScript from reading the cookie value. It would still accompany eligible requests, so XSS could perform actions and cookie-based authentication would need an explicit CSRF/SameSite design. See [MDN HttpOnly](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#httponly). Selecting that alternative requires a separate implementation issue covering the contract, cookie/session lifecycle, client requests, tests and course compatibility. This documentation PR does not change authentication code.

### Required acknowledgement record

| Participant | Role | Position | Date | Evidence |
| --- | --- | --- | --- | --- |
| Juan (ninjasilver3692077) | Required team acknowledgement | Pending | Pending | Pending PR conversation or review |
| Jorge (jfontx) | Required team acknowledgement | Pending | Pending | Pending PR conversation or review |
| Daniel (danieloro07) | Independent reviewer | Pending | Pending | Pending PR review |

Record the actual position, date and link from each participant's own PR response. Silence, an assignment or an earlier code approval does not establish acceptance of this proposal. Keep issue #53 open until Juan and Jorge approve or explicitly acknowledge the proposal and Daniel reviews it. After both acknowledgements, update this entry and security-audit.md section 6 together to state the actual decision and evidence; then obtain review of the final text before the coordinator merges. If the team chooses another storage mechanism, open a separate implementation issue and keep this record aligned with that choice.

This entry governs the session-token storage decision only. It does not accept other historical architecture proposals or resolve unrelated security risks.
