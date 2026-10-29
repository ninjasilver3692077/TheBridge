---
title: "PRD: TheBridge"
status: final
created: 2026-10-26
updated: 2026-10-26
---

# PRD: TheBridge

## 0. Document Purpose

This PRD defines what TheBridge does in Milestone 3 (weeks 11–15). It is written for the team, for the architecture document and API contract (issue #9), for the baseline OpenSpec specs (issues #10 and #11), and for the epics and stories that follow. It builds on the [product brief](product-brief.md) and on the [Milestone 3 rubric](briefs/brief-TheBridge-2026-10-26/addendum.md); it does not repeat them.

Vocabulary is fixed by the Glossary (§3). Features (§4) group the functional requirements, numbered FR-1 to FR-N; numbers are stable and never reused. Every FR carries a **Milestone 2** line:

- **Implemented** — the behavior exists in the Milestone 2 client and only its data source changes.
- **Partial** — part of the behavior exists; the FR says what is new.
- **New** — the behavior does not exist yet.

Cross-cutting non-functional requirements are in §5. Every assumption made while drafting was confirmed by Juan on 2026-10-26 and is now stated as a requirement.

## 1. Vision

TheBridge is a web marketplace where members of a local community share physical books by Exchange, Loan, Rental, or Sale. A member adds a book to their library, publishes it with clear terms, and receives requests that they accept or reject; the handoff happens in person.

Milestone 2 delivered the full experience in the browser, but every visitor saw their own copy of the data: a request never reached an owner. Milestone 3 gives TheBridge a real server, real accounts, and a moderating admin, so the marketplace is shared by everyone who opens the public URL.

## 2. Target User

### 2.1 Jobs To Be Done

- **As an owner**, put a book I no longer need to use, on my terms, without answering the same questions in a chat.
- **As a seeker**, find out in seconds whether someone near me has the book I need and what it costs me (a swap, a loan, a rental fee, or a price).
- **As either**, know where each request stands without chasing replies.
- **As an admin**, keep the marketplace trustworthy by removing listings that are fake, offensive, or not books.

### 2.2 Non-Users (Milestone 3)

- Bookstores and sellers operating at scale.
- Communities that cannot meet in person; TheBridge never ships books.
- People looking for digital books or e-book lending.

### 2.3 Key User Journeys

- **UJ-1. Laura publishes a textbook she no longer needs.** Laura, a fourth-semester student, finished Calculus and has the textbook on her shelf. She registers, opens My Books, searches the Catalog for the title, picks it, sets the Condition to "Good condition," and saves it. From My Books she chooses **Publish**, selects Rental, enters 15,000 COP for 14 days, and publishes. The Listing appears in the Marketplace for everyone. **Edge case:** if she enters a price of 0, the form and the server both refuse it with "Enter a price greater than 0."
- **UJ-2. Andrés requests a book and offers a swap.** Andrés needs a novel for a reading club. In the Marketplace he searches the title, filters by Exchange, and opens Laura's Listing for that novel. He logs in when prompted, chooses one of his Available Library Books to offer, and sends the Request. His Sent tab shows it as Pending. **Edge case:** if he already has an active Request on that Listing, the Request button is disabled and says so.
- **UJ-3. Laura accepts a Request and closes the loop.** Laura opens Requests and sees two Pending Requests for the same Listing in her Received tab. She accepts Andrés's; the other Request becomes Rejected and the Listing becomes Reserved. They meet on campus the next day, and Laura marks the Request Completed. Andrés sees each change in his Sent tab.
- **UJ-4. Camila removes a fake Listing.** Camila is the community's admin. She logs in and lands on the Admin Area, which members never see. She reviews recent Listings, finds one titled "free money," and removes it with the reason "Not a book." The Listing disappears from the Marketplace, and its Pending Requests are rejected.

## 3. Glossary

- **Account** — a registered identity with a name, an email, a password, and exactly one Role.
- **Role** — either **Member** or **Admin**. A Role is assigned at registration (always Member) or by seed (Admin) and never changes in the app.
- **Member** — an Account with the Member role. A Member acts as Owner and Requester with the same Account.
- **Admin** — an Account with the Admin role. An Admin moderates and does not publish or request.
- **Catalog** — the public Open Library search used to find book metadata (title, author, cover, year, publisher, ISBN, language).
- **Library Book** — a physical book in a Member's library (My Books): catalog metadata plus a Condition and optional notes. One Member has many Library Books.
- **Condition** — one of Like new, Good condition, Used copy.
- **Library Book Status** — Available, Published, Reserved, Lent, or Transferred.
- **Listing** — a Library Book offered under one Modality with its Terms. A Library Book has at most one open Listing.
- **Owner** — the Member who owns the Library Book behind a Listing.
- **Modality** — Exchange, Loan, Rental, or Sale.
- **Terms** — the Modality's conditions: for Exchange, an optional desired book ("Open to offers" when empty); for Loan, a duration; for Rental, a price and a duration; for Sale, a price. Durations are 7, 10, 14, or 21 days; prices are positive amounts in COP.
- **Listing Status** — Available, Reserved, Closed, or Removed.
- **Request** — a Member's expression of interest in another Member's Listing. For Exchange it carries one Offered Book.
- **Requester** — the Member who sends a Request.
- **Offered Book** — the Requester's Available Library Book proposed in an Exchange Request.
- **Request Status** — Pending, Accepted, Rejected, Cancelled, or Completed.
- **Needs reconfirmation** — a mark on a Pending Request, not a Request Status. It is set when the Modality or Terms of the Listing change (FR-11) and cleared when the Requester reconfirms the Request.
- **Favorite** — a Catalog book a Member saved for later.
- **Visitor** — anyone using TheBridge, with or without a Session. What a Visitor can do, Members and Admins can also do.
- **Session** — the signed-in state after login, tied to one Account and one Role; it ends on logout or expiry.
- **Admin Area** — the section only Admins can open: overview, lists, and Listing removal.

## 4. Features

### 4.1 Accounts and Access

**Description:** People register with a name, an email, and a password, and log in to get a session. Registration always creates a Member. Browsing the Home, the Marketplace, Listing details, and About needs no Account; everything that writes data needs one. The session ends when it expires or the person logs out, and the person is sent to the login page. Members and Admins land in different places and see different navigation. Realizes UJ-1, UJ-2, UJ-4.

**Functional Requirements:**

#### FR-1: Register

A Visitor can create an Account with a name, an email, and a password. Realizes UJ-1.

**Milestone 2:** New (Milestone 2 has a single "Continue as member" button).

**Consequences (testable):**
- The new Account has the Member role.
- An email that already belongs to an Account is rejected with a message that says so.
- A missing name, an invalid email, or a password shorter than 8 characters is rejected with a message per field.
- The password is never stored or returned in readable form.

#### FR-2: Log in and log out

A person with an Account can log in with email and password and log out. Realizes UJ-1, UJ-4.

**Milestone 2:** Partial (protected routes exist; the credential check is new).

**Consequences (testable):**
- Wrong credentials show one generic error that does not reveal whether the email exists.
- After login a Member lands on My Books and an Admin lands on the Admin Area.
- After logout, protected pages redirect to login.

#### FR-3: Protect member and admin areas

The system restricts pages and operations by Role.

**Milestone 2:** Partial (My Books, Add Book, Create Listing, and Requests already redirect to login).

**Consequences (testable):**
- Without a valid session, My Books, Add Book, Create Listing, and Requests redirect to login, and every write operation is refused as unauthenticated.
- A Member cannot open the Admin Area or call admin operations; they are refused as forbidden.
- An Admin does not see My Books, Add Book, Create Listing, or Requests in the navigation, and cannot publish or send Requests.

#### FR-4: Expire sessions

A session expires after a fixed time, and the person is sent to the login page with a message instead of seeing errors. A Session lasts 24 hours.

**Milestone 2:** New.

**Consequences (testable):**
- An expired session on any page redirects to login with "Your session expired. Please log in again."
- After logging in again, the person returns to the page they were on.

### 4.2 Catalog Search and Favorites

**Description:** Members and Visitors search the Open Library Catalog by title, author, or keyword. On open, the Marketplace shows a random discovery topic. Results show cover, title, author, and year. If Open Library fails, the last saved results for the same search are shown with the time they were saved. Favorites keep Catalog books for later.

**Functional Requirements:**

#### FR-5: Search the Catalog

A Visitor can search the Catalog and see up to 20 results, with loading, success, saved-data, empty, and error states.

**Milestone 2:** Implemented.

**Consequences (testable):**
- A query shorter than 3 characters shows "Use at least 3 characters." and does not search.
- When Open Library is unreachable and saved results exist for that query, they are shown with their saved time; otherwise an error explains whether the person is offline.
- A new search cancels the previous one in flight.

#### FR-6: Keep Favorites

A Member can add and remove Catalog books as Favorites and see them in a Favorites section.

**Milestone 2:** Partial (Favorites exist per browser; tying them to the Account is new).

**Consequences (testable):**
- Favorites are stored with the Account, so Favorites saved on one device appear on another after login.
- A Visitor without a Session who tries to save a Favorite is sent to login.

### 4.3 My Books (Personal Library)

**Description:** My Books lists a Member's Library Books with their Library Book Status and any activity (a pending Request, who has a book on loan). A Member adds a book by picking it from the Catalog, choosing a Condition, and adding notes. Realizes UJ-1.

**Functional Requirements:**

#### FR-7: View My Books

A Member can see all their Library Books with cover, title, author, Condition, Library Book Status, and current activity. Realizes UJ-1.

**Milestone 2:** Implemented (from local data; new Accounts now start with an empty library instead of seeded books).

**Consequences (testable):**
- A Member sees only their own Library Books.
- An empty library shows an empty state with a link to Add Book.
- Transferred books are not shown among active books.
- My Books can be filtered by Library Book Status and shows a count per status; the filters and counts keep working as in Milestone 2.

#### FR-8: Add a Library Book

A Member can add a Library Book by picking a Catalog result, choosing a Condition, and optionally adding notes. Realizes UJ-1.

**Milestone 2:** Implemented.

**Consequences (testable):**
- A book without a Condition is not saved, and the form says why.
- The new Library Book has status Available.

#### FR-9: Edit and delete a Library Book

A Member can change the Condition and notes of a Library Book, and delete it.

**Milestone 2:** New.

**Consequences (testable):**
- Only Available Library Books can be edited or deleted; Published, Reserved, and Lent books show why they cannot.
- A Library Book that is the Offered Book of a Pending Request cannot be edited, deleted, published, or offered in another Request; it is free again when that Request becomes Rejected or Cancelled.

### 4.4 Listings

**Description:** A Member turns an Available Library Book into a Listing by choosing a Modality and its Terms. Listings are public. The Owner can edit the Terms or withdraw the Listing while it is Available. Realizes UJ-1.

**Functional Requirements:**

#### FR-10: Publish a Listing

A Member can publish one of their Available Library Books with a Modality and Terms. Realizes UJ-1.

**Milestone 2:** Implemented.

**Consequences (testable):**
- Loan requires a duration; Rental requires a price greater than 0 and a duration; Sale requires a price greater than 0; Exchange accepts an optional desired book picked from the Catalog.
- The same rules are enforced by the server, so invalid Terms are rejected even when sent outside the app.
- Publishing sets the Library Book to Published and the Listing to Available.
- Opening Create Listing for a book that is missing or not Available selects another Available book and explains why.

#### FR-11: Edit a Listing

An Owner can change the Modality or Terms of their Listing while it is Available.

**Milestone 2:** New.

**Consequences (testable):**
- A Reserved, Closed, or Removed Listing cannot be edited.
- Pending Requests stay Pending after an edit, and each keeps the Modality and Terms it was sent under.
- If the Modality or Terms change, every Pending Request on the Listing is marked as needing reconfirmation. The Owner cannot accept it until the Requester reconfirms it under the new Modality and Terms (for an Exchange, by choosing an Offered Book); the Requester can also cancel it.
- If the new Modality is not Exchange, the Offered Book of each Pending Request is free again when the edit is saved.
- If the new Modality is Exchange, a Pending Request keeps its Offered Book Reserved until the Requester reconfirms it with the same or another Available Library Book; if the Requester chooses another, the previous Offered Book is free again. A Pending Request without an Offered Book needs the Requester to choose one before it can be accepted.

#### FR-12: Withdraw a Listing

An Owner can delete their Listing while it is Available.

**Milestone 2:** New.

**Consequences (testable):**
- The Library Book returns to Available.
- Every Pending Request on the Listing becomes Rejected.

### 4.5 Marketplace and Listing Details

**Description:** The Marketplace shows every Available Listing with live search and filters, plus a statistics panel. Each Listing has a details page with the book, the Owner, the Condition, the Modality, and the Terms. Home shows a community summary and the newest Listings. Realizes UJ-2.

**Functional Requirements:**

#### FR-13: Browse and filter Listings

A Visitor can browse Listings, search by title, author, genre, or ISBN, and filter by Modality, genre, and Condition. Realizes UJ-2.

**Milestone 2:** Implemented.

**Consequences (testable):**
- Search ignores case and accents.
- Only Available Listings are shown; Reserved, Closed, and Removed ones are not.
- Results arrive in pages of 10 Listings by default, and the person can move between pages.

#### FR-14: See Marketplace statistics

A Visitor can see the total of Available Listings, the count per Modality, and the average price for Rental and Sale.

**Milestone 2:** Implemented.

**Consequences (testable):**
- The statistics are computed over all Listings that match the current search and filters, before pagination.

#### FR-15: See Listing details

A Visitor can open a Listing and see the book metadata, the Owner's name, the Condition, the Modality, and the Terms in plain words ("Open to offers," "Free loan · 14 days," a price in COP).

**Milestone 2:** Implemented (the Owner's real name is new; Milestone 2 shows sample names).

**Consequences (testable):**
- An unknown or Removed Listing shows a "not found" page with a way back to the Marketplace.
- From a Marketplace card, a quick view shows the Listing and lets a Member send a Request without leaving the Marketplace, following the same rules as FR-17.

#### FR-16: See the Home summary

A Visitor can see on Home four figures (Community listings, Sharing modes, Exchange options, Books for sale) computed from Available Listings, and the four newest Listings.

**Milestone 2:** Implemented.

### 4.6 Requests

**Description:** A Member sends a Request on another Member's Listing. Owners see Requests in a Received tab and Requesters in a Sent tab, each with a status message that says what happens next. Accepting reserves the Listing; the handoff happens in person, and the Owner then marks it Completed. Realizes UJ-2, UJ-3.

**Functional Requirements:**

#### FR-17: Send a Request

A Member can send a Request on a Listing they do not own. For Exchange, they choose one of their Available Library Books as the Offered Book. Realizes UJ-2.

**Milestone 2:** Implemented (simulated; the Request now reaches the Owner).

**Consequences (testable):**
- The request button reads Request Exchange, Request Loan, Request Rental, or Request Purchase.
- A Member cannot request their own Listing or a Listing that is not Available.
- A Member with a Pending or Accepted Request on a Listing cannot send another on it.
- A Visitor without a Session is sent to login and returns to the Listing.

#### FR-18: Review Requests

A Member can see Received and Sent Requests in separate tabs with the counterpart's name, the Listing, the Request Status, and a status message. Realizes UJ-3.

**Milestone 2:** Implemented (from sample data).

**Consequences (testable):**
- Received shows only Requests on the Member's Listings; Sent shows only Requests the Member sent.
- A change made by the counterpart appears the next time the Member opens or refreshes Requests; there are no real-time updates.
- A Pending Request that needs reconfirmation shows the Requester a Reconfirm action and a message that the Listing changed, and shows the Owner that the Request is waiting for reconfirmation.

#### FR-19: Accept or reject a Request

An Owner can accept or reject a Pending Request on their Listing. Realizes UJ-3.

**Milestone 2:** Partial (accept and reject exist; the effects on the Listing and other Requests are new).

**Consequences (testable):**
- Accepting sets the Listing to Reserved and every other Pending Request on it to Rejected.
- Accepting a Loan or Rental sets the Library Book to Lent; accepting a Sale or Exchange sets it to Reserved. In an Exchange, the Offered Book is also set to Reserved.
- The accepted status message tells both people to coordinate the handoff in person.
- A Pending Request that needs reconfirmation (FR-11) cannot be accepted, but can be rejected.

#### FR-20: Cancel a Request

A Requester can cancel their own Pending Request.

**Milestone 2:** New.

**Consequences (testable):**
- The Request becomes Cancelled and no longer blocks a new Request on that Listing.
- Its Offered Book, if any, is free again.

#### FR-21: Complete a Request

An Owner can mark an Accepted Request as Completed. For Sale and Exchange this is after the final in-person handoff; for Loan and Rental it is after the Library Book is physically returned to the Owner. Realizes UJ-3.

**Milestone 2:** New.

**Consequences (testable):**
- For Loan and Rental, the Library Book stays Lent from acceptance until the Owner marks the Request Completed after the physical return; only then does it return to Available and the Listing become Closed, unless the Listing is Removed, in which case it stays Removed. The Owner can then publish the book again.
- The Completed action for a Loan or Rental is labeled as confirming the return.
- For Sale and Exchange, the Listing becomes Closed and the Library Book becomes Transferred; in an Exchange, the Offered Book also becomes Transferred. Books do not move to the other Member's library automatically.

### 4.7 Moderation (Admin)

**Description:** The Admin Area is a separate section only Admins see. It shows totals and lists of Listings, Requests, and Members, and lets the Admin remove a Listing with a reason. Admins cannot edit or delete Accounts. Realizes UJ-4.

**Functional Requirements:**

#### FR-22: See the admin overview

An Admin can see totals of Members, Listings by Listing Status, and Requests by Request Status. Realizes UJ-4.

**Milestone 2:** New.

#### FR-23: Review Listings, Requests, and Members

An Admin can list every Listing (any Listing Status), every Request, and every Member, with search and pages. Realizes UJ-4.

**Milestone 2:** New.

**Consequences (testable):**
- Each Listing row shows its Owner's name and email; each Request row shows Requester, Owner, and Listing.
- Member rows never show passwords.

#### FR-24: Remove a Listing

An Admin can remove any Listing that is not Closed or Removed, with a required reason. Realizes UJ-4.

**Milestone 2:** New.

**Consequences (testable):**
- The Listing becomes Removed, disappears from the Marketplace, and shows the not found page to every Visitor.
- Pending Requests on it become Rejected, and their Offered Books return to Available.
- An Accepted Sale or Exchange Request becomes Rejected, and the Library Book and any Offered Book return to Available.
- Removing an Available Listing that has no Accepted Request, with or without Pending Requests, returns its Library Book to Available, so the Owner can publish it again. Acceptance case: publish a book, remove its Listing as Admin before accepting any Request, and check that the Listing is Removed and the Library Book is Available.
- An Accepted Loan or Rental Request stays Accepted and the Library Book stays Lent, because the copy is still with the borrower. The Owner can still mark that Request Completed after the physical return (FR-21); the Listing stays Removed, and only then does the Library Book return to Available.
- Removing a Listing that is already Removed is rejected and changes nothing; it never frees a Library Book that is linked to another Listing.
- The Owner sees the Listing as Removed with the reason in My Books.

### 4.8 App Shell and Information Pages

**Description:** Shared navigation, theme, About, and fallback pages.

**Functional Requirements:**

#### FR-25: Navigate by Role

Everyone sees a navigation bar whose items depend on the Session: without a Session it shows Home, Marketplace, About, and Log in; Members add My Books and Requests; Admins see the Admin Area instead.

**Milestone 2:** Partial (navigation exists; Role-based items are new).

#### FR-26: Switch theme

A Visitor can switch between light and dark themes, and the choice is remembered on that device.

**Milestone 2:** Implemented.

#### FR-27: Read About

A Visitor can read the project flow, the user stories, and the team.

**Milestone 2:** Implemented.

#### FR-28: Fall back on unknown pages

An unknown address shows a 404 page with a link Home, including on direct visits and reloads.

**Milestone 2:** Implemented.

## 5. Cross-Cutting Non-Functional Requirements

**Delivery**
- **NFR-1:** The complete product (client, server, database) runs from one public Vercel URL that responds with HTTP 200, recorded in `deployment.txt`. If it is not deployed and public, it cannot be graded.
- **NFR-2:** Lint passes with no errors on client and server on every pull request.

**API behavior**
- **NFR-3:** Every error response has the body `{ "error": string, "code": number }`, where `code` equals the HTTP status.
- **NFR-4:** Invalid input returns 400 with a message that names the problem; it never causes a 500.
- **NFR-5:** Missing or invalid sessions return 401; valid sessions without the required Role return 403; unknown resources return 404.
- **NFR-6:** Collection endpoints accept a page number and page size (default 10) and return the total count.
- **NFR-7:** The API is documented in `api-design.md` before its code is written.

**Security** (each item is justified in `security-audit.md`)
- **NFR-8:** Passwords are stored only as salted hashes.
- **NFR-9:** The session token carries the Account id and Role and expires (FR-4).
- **NFR-10:** The server accepts browser requests only from the client's domain.
- **NFR-11:** Every input is validated on the server and checked for type before it reaches a database query, to prevent NoSQL injection.
- **NFR-12:** User text (notes, names, reasons) is rendered as text, never as HTML, to prevent XSS.
- **NFR-13:** No secret (database connection, token secret) appears in the repository; `.env.example` lists the variables.
- **NFR-14:** The server sets standard security headers and limits the request rate on login and registration.

**Code quality**
- **NFR-15:** Shared entities (at least Listing, Request, Library Book, Account) are typed once and used by both client and server, with strict type checking and no `any`.
- **NFR-16:** Components and hooks read and write domain data, including the Session token, only through `src/services/*`; outside the services, the theme preference is the only direct browser-storage use.
- **NFR-17:** Code files contain no comments.

**Experience**
- **NFR-18:** Visible text is in English.
- **NFR-19:** Every page works from 360 px phones to desktop, keeps the Milestone 2 accessibility (labels, focus handling in dialogs, keyboard use), and shows loading, empty, and error states for every server call.

## 6. Constraints

The course rubric (HW11–HW15) fixes the stack and several deliverables, so they are constraints, not choices: Express, MongoDB with Mongoose, JSON Web Tokens with bcrypt, TypeScript, helmet, express-rate-limit, and Vercel. The required files and their weekly order are listed in the [rubric addendum](briefs/brief-TheBridge-2026-10-26/addendum.md). Where they live in the repository is decided in the architecture document.

## 7. Non-Goals

- TheBridge does not process payments; prices are informative.
- TheBridge does not provide chat, notifications, or email; people coordinate in person.
- TheBridge does not handle delivery, logistics, or locations.
- TheBridge does not support more than one community or Roles beyond Member and Admin.
- Admins do not edit, suspend, or delete Accounts.
- Members cannot edit their profile or change or reset their password in Milestone 3.
- Ratings, reviews, and handoff history are not part of Milestone 3.

## 8. Scope by Week

| Week | Delivers | FR / NFR |
|---|---|---|
| 11 | API design and CRUD for Listings, in memory, with pagination | FR-10–FR-13, NFR-3, NFR-6, NFR-7 |
| 12 | Persistence for Accounts, Library Books, Listings, Requests; validation returns 400; Listings include Owner data | FR-7–FR-12, FR-15, NFR-4 |
| 13 | Accounts, sessions, Roles, Requests, Moderation; client reads only from the API | FR-1–FR-4, FR-6, FR-17–FR-25, NFR-5, NFR-8–NFR-10 |
| 14 | Shared types and strict type checking | NFR-15 |
| 15 | Security audit, headers, rate limit, final URL | NFR-1, NFR-11–NFR-14 |

FRs marked Implemented keep working every week; their data source changes in weeks 12 and 13.

## 9. Success Metrics

**Primary**
- **SM-1:** Each weekly assignment passes its autograder checks on the deadline. Validates the row of §8 for that week.
- **SM-2:** UJ-1 to UJ-4 can be performed end to end on the public URL with two Member Accounts and one Admin Account. Validates FR-1–FR-24.
- **SM-3:** Every Milestone 2 behavior still works after the switch to the API. Validates every FR marked Implemented or Partial.

**Secondary**
- **SM-4:** Every FR maps to an OpenSpec spec, a pull request, and a review by another team member.

**Counter-metrics (do not optimize)**
- **SM-C1:** Number of features. Adding features beyond this PRD puts the weekly deadlines at risk. Counterbalances SM-1.
- **SM-C2:** Share of code migrated to TypeScript. The rubric asks for a defined minimum; migrating everything delays the other weeks. Counterbalances SM-1.

## 10. Open Questions

1. Where do the graded files (`routes/`, `models/`, `api-design.md`, `deployment.txt`, `.env.example`, `src/types.ts`) live relative to `client/` and `server/`? Owner: Edwin, issue #9.
2. Does `api-design.md` mirror the architecture document, or is it the source of the API contract? Owner: Edwin, issue #9.
3. How is the Admin Account created on Vercel (seed script, environment variable)? Owner: Edwin, issue #9.
4. What sample data seeds the production database for the demo, and do `src/data/listings.js`, `myBooks.js`, and `requests.js` become that seed? Do UI content arrays such as `aboutContent.js` and `navigation.js` count as mock data under HW13? Owner: team.
5. Moving hosting from GitHub Pages to Vercel changes `AGENTS.md`, `DECISIONS.md`, `README.md`, and the `/TheBridge/` base path. Who proposes that pull request? Owner: coordinator.
