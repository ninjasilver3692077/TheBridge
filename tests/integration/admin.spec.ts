import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import jwt from "jsonwebtoken";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import mongoose from "mongoose";
import type { BookMetadata, ListingTerms, Modality } from "@/types";
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
let adminId = "";
let ownerId = "";
let requesterId = "";

function tokenFor(accountId: string): string {
  return jwt.sign({}, jwtSecret, { algorithm: "HS256", subject: accountId, expiresIn: 600 });
}

async function createAccount(name: string, email: string, role: "Member" | "Admin"): Promise<string> {
  const account = await AccountModel.create({ name, email, passwordHash: "x".repeat(60), role });
  return String(account._id);
}

async function seedScenario(modality: Modality, listingStatus: "Available" | "Reserved", copyStatus: "Published" | "Reserved" | "Lent", requestStatus: "Pending" | "Accepted") {
  const copy = await LibraryBookModel.create({ owner: ownerId, book, condition: "Good condition", notes: "", status: copyStatus });
  const listing = await ListingModel.create({
    libraryBook: copy._id, owner: ownerId, book, condition: "Good condition", description: "",
    modality, terms: termsByModality[modality], status: listingStatus,
  });
  const offered = modality === "Exchange"
    ? await LibraryBookModel.create({ owner: requesterId, book: { ...book, catalogId: "/works/OL1168083W", title: "1984" }, condition: "Used copy", notes: "", status: requestStatus === "Accepted" ? "Reserved" : "Available" })
    : null;
  const request = await RequestModel.create({
    listing: listing._id, owner: ownerId, requester: requesterId,
    offeredBook: offered?._id ?? null,
    offeredBookSnapshot: offered ? { id: String(offered._id), book: offered.book, condition: offered.condition } : null,
    listingSummary: { id: String(listing._id), title: book.title, author: book.author, coverUrl: null, modality, status: listingStatus },
    status: requestStatus, quotedModality: modality, quotedTerms: termsByModality[modality],
  });
  return { copy, listing, offered, request };
}

async function remove(listingId: unknown, body: unknown, token = tokenFor(adminId)) {
  const response = await fetch(`${baseUrl}/api/admin/listings/${String(listingId)}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: (await response.json()) as { data?: { status: string; moderation: { reason: string; removedBy: { name: string } } }; error?: string } };
}

before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = replSet.getUri();
  process.env.CLIENT_ORIGINS = "http://localhost:5173";
  process.env.JWT_SECRET = jwtSecret;
  await mongoose.connect(replSet.getUri());
  await Promise.all([AccountModel.syncIndexes(), LibraryBookModel.syncIndexes(), ListingModel.syncIndexes(), RequestModel.syncIndexes()]);
  adminId = await createAccount("Admin Root", "admin@example.edu", "Admin");
  ownerId = await createAccount("Laura Gomez", "laura@example.edu", "Member");
  requesterId = await createAccount("Andres Perez", "andres@example.edu", "Member");
  const server = createApp().listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  closeServer = () => server.close();
});

after(async () => {
  closeServer();
  await mongoose.disconnect();
  await replSet.stop();
});

test("ADMIN-05 on an Accepted Exchange rejects the request and releases both copies", async () => {
  const { copy, listing, offered, request } = await seedScenario("Exchange", "Reserved", "Reserved", "Accepted");
  const result = await remove(listing._id, { reason: "  Violates community rules  " });
  assert.equal(result.status, 200);
  assert.equal(result.body.data?.status, "Removed");
  assert.equal(result.body.data?.moderation.reason, "Violates community rules");
  assert.equal(result.body.data?.moderation.removedBy.name, "Admin Root");
  const stored = await RequestModel.findById(request._id);
  assert.equal(stored?.status, "Rejected");
  assert.equal(stored?.rejectionReason, "ListingRemoved");
  assert.equal((await LibraryBookModel.findById(copy._id))?.status, "Available");
  assert.equal((await LibraryBookModel.findById(offered?._id))?.status, "Available");
  assert.equal((await LibraryBookModel.findById(copy._id))?.lastModeration?.reason, "Violates community rules");
});

test("ADMIN-05 on an Accepted Loan keeps the request Accepted and the copy Lent", async () => {
  const { copy, listing, request } = await seedScenario("Loan", "Reserved", "Lent", "Accepted");
  const result = await remove(listing._id, { reason: "Spam" });
  assert.equal(result.status, 200);
  const stored = await RequestModel.findById(request._id);
  assert.equal(stored?.status, "Accepted");
  assert.equal(stored?.rejectionReason, null);
  assert.equal(stored?.listingSummary.status, "Removed");
  const storedCopy = await LibraryBookModel.findById(copy._id);
  assert.equal(storedCopy?.status, "Lent");
  assert.equal(storedCopy?.lastModeration?.reason, "Spam");
});

test("ADMIN-05 on an Available Sale rejects Pending requests and frees the copy", async () => {
  const { copy, listing, request } = await seedScenario("Sale", "Available", "Published", "Pending");
  const result = await remove(listing._id, { reason: "Counterfeit" });
  assert.equal(result.status, 200);
  const stored = await RequestModel.findById(request._id);
  assert.equal(stored?.status, "Rejected");
  assert.equal(stored?.rejectionReason, "ListingRemoved");
  assert.equal((await LibraryBookModel.findById(copy._id))?.status, "Available");
});

test("ADMIN-05 repeated removal is 409 and never overwrites the first reason", async () => {
  const { listing } = await seedScenario("Sale", "Available", "Published", "Pending");
  assert.equal((await remove(listing._id, { reason: "First reason" })).status, 200);
  assert.equal((await remove(listing._id, { reason: "Second reason" })).status, 409);
  assert.equal((await ListingModel.findById(listing._id))?.moderation?.reason, "First reason");
});

test("ADMIN-05 validates the reason and the caller before changing anything", async () => {
  const { listing } = await seedScenario("Sale", "Available", "Published", "Pending");
  for (const body of [{}, { reason: "   " }, { reason: 5 }, { reason: "x".repeat(501) }, { reason: "ok", extra: 1 }]) {
    assert.equal((await remove(listing._id, body)).status, 400);
  }
  assert.equal((await remove(listing._id, { reason: "ok" }, tokenFor(ownerId))).status, 403);
  assert.equal((await ListingModel.findById(listing._id))?.status, "Available");
});

test("ADMIN-01 overview has every status key and counts only Members", async () => {
  const response = await fetch(`${baseUrl}/api/admin/overview`, { headers: { authorization: `Bearer ${tokenFor(adminId)}` } });
  const { data } = (await response.json()) as { data: { memberCount: number; listingsByStatus: Record<string, number>; requestsByStatus: Record<string, number> } };
  assert.equal(response.status, 200);
  assert.equal(data.memberCount, 2);
  assert.deepEqual(Object.keys(data.listingsByStatus).sort(), ["Available", "Closed", "Removed", "Reserved"]);
  assert.deepEqual(Object.keys(data.requestsByStatus).sort(), ["Accepted", "Cancelled", "Completed", "Pending", "Rejected"]);
  assert.ok((data.listingsByStatus.Removed ?? 0) >= 3);
});

test("ADMIN-03 lists requests with both emails and filters by status", async () => {
  const response = await fetch(`${baseUrl}/api/admin/requests?status=Accepted`, { headers: { authorization: `Bearer ${tokenFor(adminId)}` } });
  const body = (await response.json()) as { data: { status: string; ownerEmail: string; requesterEmail: string }[]; meta: { total: number } };
  assert.equal(response.status, 200);
  assert.ok(body.meta.total >= 1);
  for (const item of body.data) {
    assert.equal(item.status, "Accepted");
    assert.equal(item.ownerEmail, "laura@example.edu");
    assert.equal(item.requesterEmail, "andres@example.edu");
  }
});
