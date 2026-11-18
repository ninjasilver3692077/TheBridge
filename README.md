# Live site

https://thebridge-sepia.vercel.app

# Integrants

Edwin Andres Montano Castaneda
Juan Esteban Gonzalez Villarreal
Daniel Orozco
Jorge Fontalvo

# TheBridge

**DSAW · Universidad de La Sabana**

## Project Name

TheBridge is a community book marketplace where people exchange, lend, rent, or sell physical books. The project started from a university-campus problem (the Milestone 1 context below), and the product is designed for any small local community.

It is a React single-page application backed by an Express API and MongoDB, deployed together on Vercel. Members register, keep a personal library, publish listings, send and answer requests, and save favorite books; an Admin moderates the community. Book search in the Marketplace catalog, Add Book and the desired-book picker uses the public Open Library API.

## Problem Statement

University students often have books they no longer use while other students need those books for classes, personal reading, or academic activities. These exchanges usually happen through chats, social media groups, or individual messages. Information becomes difficult to discover, availability is unclear, and it is not easy to distinguish whether a book is being exchanged, loaned, rented, or sold.

TheBridge centralizes this discovery and request flow for small academic communities: finding a book, reviewing its sharing conditions, asking for it, and recording the agreement until the book changes hands in person.

## Target Users

The first users are university students and members of small academic communities who are physically close enough to coordinate delivery in person. TheBridge is not a public marketplace and does not manage logistics or payments.

## Why a Web Application

TheBridge should be a web application because:

1. **Structured discovery:** book listings show their title, owner, condition, and sharing modality in one consistent place.
2. **Clear interaction:** members distinguish Exchange, Loan, Rental, and Sale offers and track each request's status instead of searching through unrelated chat messages.
3. **Accessible delivery:** members use it from a computer or phone browser without installing a native application.
4. **Shared, reliable state:** one server keeps listings, requests and libraries consistent for every member, which a spreadsheet or a chat group cannot enforce.

## Proposed Solution

TheBridge presents a searchable marketplace of physical books shared by community members. A member adds a book they own to their library, publishes it under one modality, and receives requests; the requester and owner then follow the request from Pending to Completed while the book moves between their libraries.

## Core Flow

**Find a book -> Add your book -> Choose how to share -> Publish -> Receive requests -> Connect with another member**

The handoff itself happens in person; TheBridge records it.

## User Stories

- **US-01:** As a student, I want to explore publications to find books that interest me.
- **US-02:** As a user, I want to search and filter publications to quickly find books under the modality I need.
- **US-03:** As an owner, I want to register a book I own so I can offer it on the platform.
- **US-04:** As an owner, I want to create a publication and choose whether I want to exchange, loan, rent, or sell my book.
- **US-05:** As a student, I want to send a request about a publication to express my interest.
- **US-06:** As an owner, I want to review received requests and accept or reject them.

## Implemented Product

Client screens (React 19, Vite, React Router v6, Tailwind CSS):

- **Home:** community summary and recently shared listings from the API.
- **Marketplace:** listings with real-time search, modality, genre and condition filters, statistics, and pagination; Open Library catalog search with loading, saved-data and error states and an offline cache; favorites for signed-in Members.
- **Listing details** for each listing, with the request dialog (offered book for Exchange, payment method for Sale).
- **My Books:** the Member's library with status filters (Available, Published, Loaned, Borrowed).
- **Add Book:** search Open Library and add a copy with its condition and notes.
- **Create Listing:** Exchange (optional desired book), Loan (duration), Rental (price and duration) or Sale (price and accepted payment methods: Cash, Bank transfer, Nequi, Daviplata, Card in person).
- **Requests:** Received and Sent tabs with accept, reject, cancel and complete actions.
- **Account:** register, sign in, sign out, change password, delete a Member account, and password recovery by email.
- **Admin Area:** community overview, lists of listings, requests and Members, removal of a listing with a reason, and deletion of Member accounts.
- **About** and a **404** page.

API (Express 5, MongoDB with Mongoose, TypeScript), contract in [api-design.md](api-design.md):

- Accounts and sessions: JWT bearer sessions that expire after 24 hours, bcrypt passwords, rate-limited auth endpoints, and single-use password reset links sent through Resend.
- Personal library, listings, requests and favorites, with ownership checks and multi-document updates in MongoDB transactions.
- Admin overview and moderation.

Known gap: the cover wall in the Home hero still uses sample covers from `src/data/listings.js` (tracked in issue #57).

## Deployment

Vercel serves the client at `/` and the Express API at `/api` from one project (`vercel.json`); every merge to `main` deploys. The public URL is recorded in [deployment.txt](deployment.txt). The coordinator manages the Vercel project and its environment variables.

## Local Development

1. Install Node.js and run `npm install`.
2. Copy `.env.example` to `.env` and set:
   - `MONGODB_URI`: a MongoDB Atlas database or a local replica set. Transactions are required, so a standalone `mongod` is not enough.
   - `JWT_SECRET`: a random value of at least 32 bytes. Keep `JWT_TTL_SECONDS=86400`.
   - `CLIENT_ORIGINS` and `PORT`: keep the defaults for local work.
   - Optional: `SEED_PASSWORD` for demo data, `ADMIN_NAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the Admin account, and `RESEND_API_KEY`, `MAIL_FROM` and `APP_URL` to send password recovery email.
3. Optional data: `npm run seed` creates three demo Members (`demo1`, `demo2`, `demo3` at `thebridge.example.invalid`, password `SEED_PASSWORD`) and four listings; `npm run bootstrap:admin` creates the Admin account.
4. Run `npm run dev:server` (API on port 3000) and `npm run dev` (client on port 5173, with `/api` proxied to the API).
5. Before a pull request: `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`. `npm test` needs no database; `npm run test:integration` starts a temporary MongoDB replica set and downloads the MongoDB binary the first time.

## Documentation

- [api-design.md](api-design.md): HTTP contract.
- [docs/m3-listings.md](docs/m3-listings.md): library, listings, demo seed and integration tests.
- [security-audit.md](security-audit.md) and [DECISIONS.md](DECISIONS.md): security review and recorded decisions.
- [CONTRIBUTING.md](CONTRIBUTING.md): roles, review ring and pull request workflow.
- [AI-LOG.md](AI-LOG.md) and [REFLECTION.md](REFLECTION.md): AI use record and course reflections.

## Figma Wireframes

The Figma Make reference is available in [figma-link.txt](figma-link.txt).

## Team Roles and Collaboration

**DSAW · Universidad de La Sabana**

- Juan Esteban González: coordinator; assigns tasks, merges pull requests and manages the deployment.
- Edwin Andrés Montaño: technical approver and reviewer.
- Daniel Orozco: executor and reviewer.
- Jorge Fontalvo: executor and reviewer.

The team uses GitHub Flow:

1. Create one branch per task from `main`.
2. Make small, meaningful commits.
3. Open a pull request with verification notes.
4. Receive an approval from a team member other than the author.
5. The coordinator merges after approval.

Every member contributes from their own GitHub account. [CONTRIBUTING.md](CONTRIBUTING.md) has the details.

## AI Use

AI agents help structure requirements, implement tasks and review changes. The team decides the scope, validates every result, and records adopted and manually changed suggestions in [AI-LOG.md](AI-LOG.md).

## Scope

In scope: one community with Member and Admin roles, personal libraries, listings in four modalities, requests through completion, favorites, account management with password recovery by email, and Admin moderation.

Out of scope:

- Processing payments; prices and payment methods are informative.
- Chat and activity notifications; people coordinate in person.
- Delivery, logistics and locations.
- More than one community or roles beyond Member and Admin.
- Editing profile fields (name, email, role) after registration, and editing or suspending accounts from the Admin Area.
- Ratings, reviews and handoff history.
- Refresh tokens or server-side revocation of sessions.
