---
title: "Product Brief: TheBridge"
status: final
created: 2026-10-26
updated: 2026-10-26
---

# Product Brief: TheBridge

## Executive Summary

TheBridge is a web marketplace where members of a local community share physical books in four ways: Exchange, Loan, Rental, and Sale. An owner registers a book, chooses how to share it, and publishes it; any member can find it, see its condition and terms at a glance, and send a request that the owner accepts or rejects. The handoff happens in person.

Today these exchanges live in chat groups and social media posts, where offers scroll away, availability is unclear, and it is hard to tell whether a book is being given, lent, rented, or sold. There is no platform dedicated to sharing books inside a local community, and TheBridge fills that gap.

Milestone 2 proved the experience as a React prototype whose data lives in each visitor's browser. Milestone 3 (weeks 11–15) adds an Express API backed by MongoDB, real accounts, and an admin role, and runs on Vercel, so a published listing is visible to everyone and a request actually reaches its owner. That shift turns the prototype into a working product.

## The Problem

A student finishes a course and keeps the textbook on a shelf; another student needs that book next semester and buys it new or goes without. The same happens in neighborhoods, reading clubs, and workplaces. People who would share a book have no common place to say so:

- Offers posted in chats are buried within hours and cannot be searched or filtered.
- Terms are informal: "I have this book" rarely says whether it is a swap, a loan for two weeks, a paid rental, or a sale, or what condition it is in.
- Nobody knows whether a book is still available or who already asked for it.

The cost is unused books, duplicated purchases, and a lot of messaging to arrange a single handoff.

## The Solution

TheBridge gives each shared book a structured listing: title and author from the Open Library catalog, the owner, its condition, the modality, and the modality's terms (desired book or "Open to offers" for Exchange, duration for Loan, price and duration for Rental, price for Sale).

The core flow is **find a book → add your book → choose how to share → publish → receive requests → meet in person**:

- **Discover:** a marketplace with live search and filters by modality, genre, and condition, plus listing details.
- **Share:** a personal library (My Books) where owners add books from the catalog and turn them into listings.
- **Request:** a request on any listing, and a Requests view with Received and Sent tabs where owners accept or reject and both sides see the status (Pending, Accepted, Rejected).
- **Moderate:** an admin area where the community's admin sees every listing, request, and member, and can remove listings that break the community's rules.

TheBridge does not move money, ship books, or host chat; once a request is accepted, the two people coordinate the handoff in person.

## What Makes This Different

- **Dedicated to local book sharing.** General marketplaces and chat groups are not organized around books or around lending; TheBridge is.
- **Four modalities in one place.** The same book can be exchanged, lent, rented, or sold, and the terms are explicit before anyone sends a message.
- **Request status instead of message threads.** Owners and requesters see Pending, Accepted, or Rejected rather than chasing replies.

The advantage is focus, not technology. A competing group chat costs nothing, so TheBridge has to be clearly faster for finding a book and arranging a handoff.

## Who This Serves

TheBridge has two roles.

- **Member:** every registered person. As an owner, a member has books they no longer need or are willing to lend, and wants to publish quickly, set terms once, and decide who gets the book. As a seeker, a member needs a book for a course, a club, or personal reading, and wants to know fast whether someone nearby has it and on what terms. One account does both.
- **Admin:** a person the community trusts to keep the marketplace clean. The admin does not trade through the admin area; they review listings, requests, and members, and remove listings that are fake, offensive, or not books.

Members belong to the same local community and can meet in person. A university campus is the starting community, not the limit; a local community is any group small enough for in-person handoffs.

## Success Criteria

Success for this phase is passing the Milestone 3 rubric (HW11–HW15, weeks 11–15) with the public Vercel URL used on Demo Day. The weekly requirements are detailed in the [addendum](briefs/brief-TheBridge-2026-10-26/addendum.md); in product terms:

- **Week 11:** a documented REST API with full CRUD for listings and one error format on every endpoint.
- **Week 12:** listings, requests, My Books, and users persist in MongoDB, and invalid data is rejected with a clear 400.
- **Week 13:** members register and log in; the client uses only the API, with no mock data; members and admins see different sections and actions.
- **Week 14:** the shared entities are typed once and used by both client and server.
- **Week 15:** the product passes a security audit, and the complete product runs from one public URL.

Throughout: every Milestone 2 feature keeps working, a request reaches its owner and the decision reaches the requester, and every PRD requirement maps to a spec, a pull request, and a review by another team member.

## Scope

**In this phase**
- An Express API with MongoDB for users, listings, requests, and My Books, deployed on Vercel together with the React client.
- Registration and login with two roles, Member and Admin.
- The React client switched from local data to the API through its existing service modules.
- An admin area for reviewing and removing listings.
- TypeScript for shared entity types, and the security hardening the rubric requires.

**Out of scope**
- Payments; Rental and Sale prices are informative, and money changes hands in person.
- Chat, notifications, and messaging.
- Delivery logistics and geolocation.
- Multiple communities, and roles beyond Member and Admin.

## Vision

If TheBridge works for one community, the same model serves any group that already meets in person: other faculties, schools, neighborhood libraries, offices. The longer-term questions are trust (ratings, history of completed handoffs) and reach (letting a community set itself up), and they come after this phase proves that a shared, persistent marketplace gets used.
