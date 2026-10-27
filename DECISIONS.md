# Project Decisions

## Milestone 2 scope (historical)

These restrictions applied to Milestone 2, the React frontend prototype, and describe the app as delivered on GitHub Pages.

- Milestone 2 is a frontend React prototype only.
- The prototype uses simulated data and local frontend state.
- Backend, database, real authentication, payments, chat, notifications, persistence, transactions, administration, and geolocation were outside the Milestone 2 scope.

## Upcoming phase: full-stack (React + Express)

- The next phase adds an Express server alongside the React client, organized as `client/` and `server/`.
- The client keeps reading and writing domain data only through its service modules, so each service can move from `localStorage` to the API without touching components.
- Persistence, authentication, the API contract, and deployment of the server are pending; they will be decided in `_bmad-output/planning-artifacts/architecture.md` and summarized here once agreed.
- Payments, chat, notifications, and geolocation stay out of scope unless the PRD adds them.

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
