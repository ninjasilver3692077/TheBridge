import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import jwt from "jsonwebtoken";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import mongoose from "mongoose";
import type { BookMetadata, LibraryBook, ListingStatus, ListingTerms, Modality, RequestStatus } from "@/types";
import { AccountModel } from "../../models/Account.js";
import { LibraryBookModel } from "../../models/LibraryBook.js";
import { ListingModel } from "../../models/Listing.js";
import { RequestModel } from "../../models/Request.js";
import { createApp } from "../../server/app.js";

const jwtSecret = "integration-jwt-secret-with-32-bytes!!";

const book: BookMetadata = {
  catalogId: "/works/OL45804W", title: "Dune", author: "Frank Herbert", genre: "Science Fiction",
  coverUrl: null, year: 1965, publisher: null, isbn: null, language: "eng",
};

const termsByModality: Record<Modality, ListingTerms> = {
  Sale: { desiredBook: null, priceCop: 40000, durationDays: null },
  Exchange: { desiredBook: null, priceCop: null, durationDays: null },
  Loan: { desiredBook: null, priceCop: null, durationDays: 14 },
  Rental: { desiredBook: null, priceCop: 8000, durationDays: 7 },
};

let replSet: MongoMemoryReplSet;
let baseUrl = "";
let closeServer: () => void = () => undefined;
let ownerId = "";
let requesterId = "";
let secondRequesterId = "";

function tokenFor(accountId: string): string {
  return jwt.sign({}, jwtSecret, { algorithm: "HS256", subject: accountId, expiresIn: 600 });
}

async function createAccount(name: string, email: string): Promise<string> {
  const account = await AccountModel.create({ name, email, passwordHash: "x".repeat(60), role: "Member" });
  return String(account._id);
}

async function publishedCopy(modality: Modality, copyStatus: "Published" | "Reserved" | "Lent" = "Published") {
  const copy = await LibraryBookModel.create({ owner: ownerId, book, condition: "Good condition", notes: "", status: copyStatus });
  const listing = await ListingModel.create({
    libraryBook: copy._id, owner: ownerId, book, condition: "Good condition", description: "",
    modality, terms: termsByModality[modality], status: copyStatus === "Published" ? "Available" : "Reserved",
  });
  return { copy, listing };
}

async function requestOn(listing: { _id: mongoose.Types.ObjectId; status: ListingStatus },requester: string, status: RequestStatus, modality: Modality, offeredBookId: mongoose.Types.ObjectId | null = null) {
  const offered = offeredBookId ? await LibraryBookModel.findById(offeredBookId) : null;
  return RequestModel.create({
    listing: listing._id, owner: ownerId, requester,
    offeredBook: offered?._id ?? null,
    offeredBookSnapshot: offered ? { id: String(offered._id), book: offered.book, condition: offered.condition } : null,
    listingSummary: { id: String(listing._id), title: book.title, author: book.author, coverUrl: null, modality, status: listing.status },
    status, quotedModality: modality, quotedTerms: termsByModality[modality],
  });
}

async function myBooks(accountId: string): Promise<LibraryBook[]> {
  const response = await fetch(`${baseUrl}/api/my-books?limit=100`, { headers: { authorization: `Bearer ${tokenFor(accountId)}` } });
  assert.equal(response.status, 200);
  return ((await response.json()) as { data: LibraryBook[] }).data;
}

before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = replSet.getUri();
  process.env.CLIENT_ORIGINS = "http://localhost:5173";
  process.env.JWT_SECRET = jwtSecret;
  await mongoose.connect(replSet.getUri());
  await Promise.all([AccountModel.syncIndexes(), LibraryBookModel.syncIndexes(), ListingModel.syncIndexes(), RequestModel.syncIndexes()]);
  ownerId = await createAccount("Laura Gomez", "laura@example.edu");
  requesterId = await createAccount("Andres Perez", "andres@example.edu");
  secondRequesterId = await createAccount("Mateo Ruiz", "mateo@example.edu");
  const server = createApp().listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  closeServer = () => server.close();
});

after(async () => {
  closeServer();
  await mongoose.disconnect();
  await replSet.stop();
});

test("a copy without requests has null activity", async () => {
  await publishedCopy("Sale");
  const books = await myBooks(ownerId);
  assert.ok(books.length >= 1);
  assert.ok(books.every((item) => item.activity === null));
});

test("a Pending request on the owner's listing is a ReceivedRequest with the requester as counterpart", async () => {
  const { copy, listing } = await publishedCopy("Sale");
  const request = await requestOn(listing, requesterId, "Pending", "Sale");
  const found = (await myBooks(ownerId)).find((item) => item.id === String(copy._id));
  assert.deepEqual(found?.activity, {
    requestId: String(request._id), status: "Pending", kind: "ReceivedRequest",
    counterpart: { id: requesterId, name: "Andres Perez" },
  });
});

test("an Accepted request outranks a Pending one on the same copy", async () => {
  const { copy, listing } = await publishedCopy("Loan");
  await requestOn(listing, requesterId, "Pending", "Loan");
  const accepted = await requestOn(listing, secondRequesterId, "Accepted", "Loan");
  const found = (await myBooks(ownerId)).find((item) => item.id === String(copy._id));
  assert.equal(found?.activity?.status, "Accepted");
  assert.equal(found?.activity?.requestId, String(accepted._id));
  assert.equal(found?.activity?.counterpart.name, "Mateo Ruiz");
});

test("an offered copy in a Pending Exchange is an OfferedExchange with the listing owner as counterpart", async () => {
  const { listing } = await publishedCopy("Exchange");
  const offered = await LibraryBookModel.create({ owner: requesterId, book: { ...book, catalogId: "/works/OL1168083W", title: "1984" }, condition: "Used copy", notes: "", status: "Available" });
  const request = await requestOn(listing, requesterId, "Pending", "Exchange", offered._id);
  const found = (await myBooks(requesterId)).find((item) => item.id === String(offered._id));
  assert.deepEqual(found?.activity, {
    requestId: String(request._id), status: "Pending", kind: "OfferedExchange",
    counterpart: { id: ownerId, name: "Laura Gomez" },
  });
});

test("with equal status and createdAt the request with the higher id is the activity", async () => {
  const { copy, listing } = await publishedCopy("Sale");
  const first = await requestOn(listing, requesterId, "Pending", "Sale");
  const second = await requestOn(listing, secondRequesterId, "Pending", "Sale");
  const sharedCreatedAt = new Date("2026-01-01T00:00:00.000Z");
  await RequestModel.collection.updateMany({ _id: { $in: [first._id, second._id] } }, { $set: { createdAt: sharedCreatedAt } });
  const higherId = String(first._id) > String(second._id) ? first : second;
  const found = (await myBooks(ownerId)).find((item) => item.id === String(copy._id));
  assert.equal(found?.activity?.requestId, String(higherId._id));
});

async function patchRequest(requestId: string, action: "accept" | "complete", actorId: string) {
  const response = await fetch(`${baseUrl}/api/requests/${requestId}/${action}`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${tokenFor(actorId)}`, "content-type": "application/json" },
    body: "{}",
  });
  assert.equal(response.status, 200);
}

async function publishAsBorrower(copyId: string, accountId: string) {
  const response = await fetch(`${baseUrl}/api/listings`, {
    method: "POST",
    headers: { authorization: `Bearer ${tokenFor(accountId)}`, "content-type": "application/json" },
    body: JSON.stringify({ libraryBookId: copyId, modality: "Sale", terms: termsByModality.Sale }),
  });
  return response.status;
}

test("completing a Sale moves the book to the buyer's library and hides it from the seller's", async () => {
  const { copy, listing } = await publishedCopy("Sale");
  const request = await requestOn(listing, requesterId, "Pending", "Sale");
  await patchRequest(String(request._id), "accept", ownerId);
  await patchRequest(String(request._id), "complete", ownerId);
  assert.equal((await myBooks(ownerId)).some((item) => item.id === String(copy._id)), false);
  const bought = (await myBooks(requesterId)).find((item) => item.book.catalogId === book.catalogId && item.status === "Available" && item.id !== String(copy._id));
  assert.ok(bought);
  assert.equal(bought.borrowedFrom, null);
});

test("accepting a Loan gives the borrower a Borrowed copy that cannot be listed, and the return removes it", async () => {
  const { copy, listing } = await publishedCopy("Loan");
  const request = await requestOn(listing, secondRequesterId, "Pending", "Loan");
  await patchRequest(String(request._id), "accept", ownerId);
  const borrowed = (await myBooks(secondRequesterId)).find((item) => item.status === "Borrowed");
  assert.ok(borrowed);
  assert.deepEqual(borrowed.borrowedFrom, { id: ownerId, name: "Laura Gomez" });
  assert.equal(await publishAsBorrower(borrowed.id, secondRequesterId), 409);
  assert.equal((await myBooks(ownerId)).find((item) => item.id === String(copy._id))?.status, "Lent");
  await patchRequest(String(request._id), "complete", ownerId);
  assert.equal((await myBooks(secondRequesterId)).some((item) => item.id === borrowed.id), false);
  assert.equal((await myBooks(ownerId)).find((item) => item.id === String(copy._id))?.status, "Available");
});
