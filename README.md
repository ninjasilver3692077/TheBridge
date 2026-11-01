# Live site

https://thebridge-sepia.vercel.app

# Integrants

Edwin Andres Montano Castaneda
Juan Esteban Gonzalez Villarreal
Daniel Orozco
Jorge Fontalvo

# TheBridge - Milestone 2

**DSAW · Universidad de La Sabana**

## Project Name

TheBridge is a community book marketplace prototype for people who want to exchange, lend, rent, or sell physical books. The project started from a university-campus problem (described below as the Milestone 1 context), but the product is designed for any local community.

Books shared on TheBridge are local sample listings (`src/data/listings.js`), because a bibliographic API cannot provide owner, modality, condition, price, or duration. Book search in the Marketplace catalog and in Add Book uses the public Open Library API.

## Problem Statement

University students often have books they no longer use while other students need those books for classes, personal reading, or academic activities. These exchanges usually happen through chats, social media groups, or individual messages. Information becomes difficult to discover, availability is unclear, and it is not easy to distinguish whether a book is being exchanged, loaned, rented, or sold.

TheBridge centralizes this discovery and request flow for small academic communities. The initial experience focuses on finding a book, reviewing its sharing conditions, and expressing interest in a simulated frontend prototype.

## Target Users

The first users are university students and members of small academic communities who are physically close enough to coordinate delivery in person. Milestone 1 is not intended for public marketplaces, logistics management, payments, or large communities.

## Why a Web Application

TheBridge should be a web application because:

1. **Structured discovery:** book publications can show their title, owner, condition, and sharing modality in one consistent place.
2. **Clear interaction:** users can distinguish Exchange, Loan, Rental, and Sale offers without searching through unrelated chat messages.
3. **Accessible delivery:** students can use the prototype from a computer or phone browser without installing a native application.
4. **Focused academic scope:** a static frontend prototype can demonstrate the core experience before future backend and persistence decisions are made.

## Proposed Solution

TheBridge presents a searchable marketplace of simulated physical book publications. A user can review available books, register a book they own, choose how to share it, and send or review simulated requests. The prototype uses local data and frontend state only.

## Core Flow

**Find a book -> Add your book -> Choose how to share -> Publish -> Receive requests -> Connect with another student**

The connection and delivery are represented as an in-person interaction for the initial scope.

## User Stories

- **US-01:** As a student, I want to explore publications to find books that interest me.
- **US-02:** As a user, I want to search and filter publications to quickly find books under the modality I need.
- **US-03:** As an owner, I want to register a book I own so I can offer it on the platform.
- **US-04:** As an owner, I want to create a publication and choose whether I want to exchange, loan, rent, or sell my book.
- **US-05:** As a student, I want to send a request about a publication to express my interest.
- **US-06:** As an owner, I want to review received requests and accept or reject them.

## React Prototype

TheBridge is now implemented as a React application using Vite and React Router v6.

Implemented screens and flows:

- Home with a community summary and recently shared listings
- Marketplace with real-time listing search, modality, genre, and condition filters, and a live statistics panel
- Open Library search with loading, success, saved-data, and error states, offline cache, and persistent favorites
- My Books
- Add Book
- Create Listing
- Dynamic Listing Details
- Simulated Send Request flow
- Requests with Received/Sent tabs and status actions
- About with project flow, user stories, and team information
- Login and protected routes
- 404 fallback

The application is deployed on Vercel at:

https://thebridge-sepia.vercel.app

## Deployment

Vercel serves the client at `/` and the Express API at `/api` from one project (`vercel.json`); every merge to `main` deploys. The public URL is recorded in `deployment.txt`.

## Local development

1. Copy `.env.example` to `.env` and fill in `MONGODB_URI` and `JWT_SECRET`.
2. Run `npm run dev:server` (API on port 3000) and `npm run dev` (client on port 5173, `/api` proxied to the API).
3. Before a pull request: `npm run lint`, `npm run typecheck` and `npm run build`.

## Figma Wireframes

The Figma Make reference is available in [figma-link.txt](figma-link.txt). Before submission, the team must confirm that the shared file includes the main screens and supporting UI states such as empty, loading, error, validation, and success states.

## Team Roles and Collaboration

**DSAW · Universidad de La Sabana**

- Edwin AndrÃ©s MontaÃ±o â€” Shared UI system, Home & Marketplace
- Juan Esteban GonzÃ¡lez â€” Personal library & listing flows
- Jorge Fontalvo â€” Personal library & listing flows
- Daniel Orozco â€” Requests, About & documentation

The team uses a simple GitHub Flow:

1. Create a short-lived feature branch from `main`.
2. Make small, meaningful commits.
3. Open a pull request with verification notes.
4. Receive a review from another team member.
5. Merge only after the changes are coherent with the shared product context.

The team must produce real functional contributions from multiple GitHub accounts. Empty or cosmetic commits do not satisfy the collaboration requirement.

## AI Use

AI may help structure requirements, propose implementation details, and review frontend changes. The team remains responsible for narrowing the scope, validating the result, and recording adopted and manually changed suggestions. The detailed record is in [AI-LOG.md](AI-LOG.md). The array-method reflection is in [REFLECTION.md](REFLECTION.md).

## Local Preview

Install dependencies with `npm install`, then start the Vite development server with `npm run dev`. Run `npm run lint` and `npm run build` before opening a pull request.

## Milestone 2 Scope

Milestone 2 is a responsive React frontend prototype using Vite, React Router, Tailwind CSS, local mock data, browser state, and localStorage. It does not include a backend, database, real authentication, payments, chat, notifications, real transactions, administration, delivery logistics, or geolocation.
