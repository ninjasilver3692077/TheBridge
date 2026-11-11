import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import mongoose, { Types } from "mongoose";
import type { BookMetadata, BookRequest, Favorite, ListingTerms } from "@/types";
import { AccountModel } from "../../models/Account.js";
import { FavoriteModel } from "../../models/Favorite.js";
import { LibraryBookModel } from "../../models/LibraryBook.js";
import { ListingModel } from "../../models/Listing.js";
import { RequestModel } from "../../models/Request.js";
import { createApp } from "../../server/app.js";

const jwtSecret = "integration-jwt-secret-with-32-bytes!!";

const book: BookMetadata = {
  catalogId: "/works/OL45804W",
  title: "Dune",
  author: "Frank Herbert",
  genre: "Science Fiction",
  coverUrl: null,
  year: 1965,
  publisher: null,
  isbn: null,
  language: "eng",
};

const offeredBook: BookMetadata = {
  ...book,
  catalogId: "/works/OL1168083W",
  title: "1984",
  author: "George Orwell",
};

const saleTerms: ListingTerms = { desiredBook: null, priceCop: 40000, durationDays: null };
const exchangeTerms: ListingTerms = { desiredBook: null, priceCop: null, durationDays: null };

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

async function createCopy(owner: string, metadata: BookMetadata, status: "Available" | "Published") {
  return LibraryBookModel.create({ owner, book: metadata, condition: "Good condition", notes: "", status });
}

async function createListing(
  owner: string,
  copyId: Types.ObjectId,
  modality: "Sale" | "Exchange",
  terms: ListingTerms,
) {
  return ListingModel.create({
    libraryBook: copyId,
    owner,
    book,
    condition: "Good condition",
    description: "",
    modality,
    terms,
    status: "Available",
  });
}

async function sendRequest(listingId: string, requester: string, offeredBookId?: string) {
  const response = await fetch(`${baseUrl}/api/listings/${listingId}/requests`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${tokenFor(requester)}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(offeredBookId ? { offeredBookId } : {}),
  });
  const body = (await response.json()) as { data?: { quotedTerms: ListingTerms }; error?: string };
  return { status: response.status, body };
}

async function holdOpenTransaction(work: (session: mongoose.ClientSession) => Promise<void>) {
  const session = await mongoose.connection.startSession();
  session.startTransaction();
  await work(session);
  return {
    commit: async () => {
      await session.commitTransaction();
      await session.endSession();
    },
  };
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = replSet.getUri();
  process.env.CLIENT_ORIGINS = "http://localhost:5173";
  process.env.JWT_SECRET = jwtSecret;
  await mongoose.connect(replSet.getUri());
  await Promise.all([
    AccountModel.syncIndexes(),
    FavoriteModel.syncIndexes(),
    LibraryBookModel.syncIndexes(),
    ListingModel.syncIndexes(),
    RequestModel.syncIndexes(),
  ]);
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

test("real indexes: partial unique indexes exist and reject duplicate active requests", async () => {
  const indexes = await RequestModel.collection.indexes();
  const uniquePartial = indexes.filter((index) => index.unique && index.partialFilterExpression);
  assert.equal(uniquePartial.length, 3);

  const copy = await createCopy(ownerId, book, "Published");
  const listing = await createListing(ownerId, copy._id, "Sale", saleTerms);
  const first = await sendRequest(String(listing._id), requesterId);
  assert.equal(first.status, 201);
  const duplicate = await sendRequest(String(listing._id), requesterId);
  assert.equal(duplicate.status, 409);
  assert.equal(await RequestModel.countDocuments({ listing: listing._id }), 1);

  await assert.rejects(
    RequestModel.collection.insertOne({
      listing: listing._id,
      requester: new Types.ObjectId(requesterId),
      owner: new Types.ObjectId(ownerId),
      status: "Pending",
    }),
    (error: { code?: number }) => error.code === 11000,
  );
});

test("race: REQUEST-01 loses against a concurrent listing withdrawal and leaves no request", async () => {
  const copy = await createCopy(ownerId, book, "Published");
  const listing = await createListing(ownerId, copy._id, "Sale", saleTerms);

  const withdrawal = await holdOpenTransaction(async (session) => {
    await ListingModel.updateOne(
      { _id: listing._id, status: "Available" },
      { $set: { status: "Closed", closureReason: "Withdrawn" }, $inc: { revision: 1 } },
      { session },
    );
  });

  const pending = sendRequest(String(listing._id), requesterId);
  await pause(400);
  await withdrawal.commit();
  const result = await pending;

  assert.equal(result.status, 409);
  assert.equal(await RequestModel.countDocuments({ listing: listing._id }), 0);
});

test("race: REQUEST-01 retries and quotes the terms committed by a concurrent edit", async () => {
  const copy = await createCopy(ownerId, book, "Published");
  const listing = await createListing(ownerId, copy._id, "Sale", saleTerms);

  const edit = await holdOpenTransaction(async (session) => {
    await ListingModel.updateOne(
      { _id: listing._id, status: "Available" },
      { $set: { "terms.priceCop": 55000 }, $inc: { revision: 1 } },
      { session },
    );
  });

  const pending = sendRequest(String(listing._id), requesterId);
  await pause(400);
  await edit.commit();
  const result = await pending;

  assert.equal(result.status, 201);
  assert.equal(result.body.data?.quotedTerms.priceCop, 55000);
  const stored = await RequestModel.find({ listing: listing._id });
  assert.equal(stored.length, 1);
  assert.equal(stored[0]?.quotedTerms.priceCop, 55000);
});

test("race: Exchange offer loses against the offered copy being published concurrently", async () => {
  const ownerCopy = await createCopy(ownerId, book, "Published");
  const listing = await createListing(ownerId, ownerCopy._id, "Exchange", exchangeTerms);
  const offeredCopy = await createCopy(requesterId, offeredBook, "Available");

  const publishing = await holdOpenTransaction(async (session) => {
    await LibraryBookModel.updateOne(
      { _id: offeredCopy._id, status: "Available" },
      { $set: { status: "Published" }, $inc: { revision: 1 } },
      { session },
    );
  });

  const pending = sendRequest(String(listing._id), requesterId, String(offeredCopy._id));
  await pause(400);
  await publishing.commit();
  const result = await pending;

  assert.equal(result.status, 409);
  assert.equal(await RequestModel.countDocuments({ listing: listing._id }), 0);
});

test("race: one offered copy cannot back two concurrent Exchange requests", async () => {
  const firstCopy = await createCopy(ownerId, book, "Published");
  const secondCopy = await createCopy(ownerId, { ...book, catalogId: "/works/OL999W" }, "Published");
  const firstListing = await createListing(ownerId, firstCopy._id, "Exchange", exchangeTerms);
  const secondListing = await createListing(ownerId, secondCopy._id, "Exchange", exchangeTerms);
  const offeredCopy = await createCopy(requesterId, offeredBook, "Available");

  const results = await Promise.all([
    sendRequest(String(firstListing._id), requesterId, String(offeredCopy._id)),
    sendRequest(String(secondListing._id), requesterId, String(offeredCopy._id)),
  ]);

  const statuses = results.map((result) => result.status).sort();
  assert.deepEqual(statuses, [201, 409]);
  assert.equal(
    await RequestModel.countDocuments({ offeredBook: offeredCopy._id, status: "Pending" }),
    1,
  );
});

test("race: two requesters hitting the same listing both succeed without corrupting state", async () => {
  const copy = await createCopy(ownerId, book, "Published");
  const listing = await createListing(ownerId, copy._id, "Sale", saleTerms);

  const results = await Promise.all([
    sendRequest(String(listing._id), requesterId),
    sendRequest(String(listing._id), secondRequesterId),
  ]);

  assert.deepEqual(results.map((result) => result.status), [201, 201]);
  assert.equal(await RequestModel.countDocuments({ listing: listing._id, status: "Pending" }), 2);
});

test("tombstone: soft-deleted LibraryBook is hidden from REQUEST-01 and aborts concurrent offers", async () => {
  const ownerCopy = await createCopy(ownerId, book, "Published");
  const listing = await createListing(ownerId, ownerCopy._id, "Exchange", exchangeTerms);
  const deletedCopy = await LibraryBookModel.create({
    owner: requesterId,
    book: offeredBook,
    condition: "Good condition",
    notes: "",
    status: "Available",
    deletedAt: new Date(),
  });

  const alreadyDeleted = await sendRequest(
    String(listing._id),
    requesterId,
    String(deletedCopy._id),
  );
  assert.equal(alreadyDeleted.status, 404);

  const liveCopy = await createCopy(requesterId, offeredBook, "Available");
  const deleting = await holdOpenTransaction(async (session) => {
    await LibraryBookModel.updateOne(
      { _id: liveCopy._id, status: "Available", deletedAt: null },
      { $set: { deletedAt: new Date() }, $inc: { revision: 1 } },
      { session },
    );
  });

  const pending = sendRequest(String(listing._id), requesterId, String(liveCopy._id));
  await pause(400);
  await deleting.commit();
  const result = await pending;

  assert.equal(result.status, 404);
  assert.equal(await RequestModel.countDocuments({ listing: listing._id }), 0);
});

test("curl evidence executes every FAVORITE and REQUEST endpoint against the real local replica set", async () => {
  const run = promisify(execFile);
  const favoriteIndexes = await FavoriteModel.collection.indexes();
  assert.ok(
    favoriteIndexes.some(
      (idx) => idx.unique && idx.key.owner === 1 && idx.key["book.catalogId"] === 1,
    ),
  );

  async function curl<T = Record<string, unknown>>(
    operation: string,
    method: string,
    path: string,
    actorId: string,
    expected: number,
    body?: unknown,
  ): Promise<T> {
    const args = [
      "--silent",
      "--show-error",
      "--max-time",
      "15",
      "--write-out",
      "\n%{http_code}",
      "--request",
      method,
      "--header",
      `Authorization: Bearer ${tokenFor(actorId)}`,
    ];
    if (body !== undefined) {
      args.push("--header", "Content-Type: application/json", "--data-binary", JSON.stringify(body));
    }
    args.push(baseUrl + path);
    const { stdout } = await run(process.platform === "win32" ? "curl.exe" : "curl", args, {
      windowsHide: true,
    });
    const boundary = stdout.lastIndexOf("\n");
    const status = Number(stdout.slice(boundary + 1));
    assert.equal(status, expected, operation);
    const parsed = JSON.parse(stdout.slice(0, boundary)) as { data: T };
    return parsed.data;
  }

  const createdFavorite = await curl<Favorite>(
    "FAVORITE-02",
    "POST",
    "/api/favorites",
    requesterId,
    201,
    { book },
  );
  await curl("FAVORITE-02-duplicate", "POST", "/api/favorites", requesterId, 409, { book });
  await curl("FAVORITE-01", "GET", "/api/favorites?page=1&limit=10", requesterId, 200);
  await curl(
    "FAVORITE-03",
    "DELETE",
    `/api/favorites/${createdFavorite.id}`,
    requesterId,
    200,
  );

  const rejectCopy = await createCopy(ownerId, book, "Published");
  const rejectListing = await createListing(ownerId, rejectCopy._id, "Sale", saleTerms);
  const toReject = await curl<BookRequest>(
    "REQUEST-01-reject",
    "POST",
    `/api/listings/${String(rejectListing._id)}/requests`,
    requesterId,
    201,
    {},
  );
  const rejected = await curl<BookRequest>(
    "REQUEST-05",
    "PATCH",
    `/api/requests/${toReject.id}/reject`,
    ownerId,
    200,
    {},
  );
  assert.equal(rejected.status, "Rejected");
  assert.equal(rejected.rejectionReason, "OwnerRejected");

  const toCancel = await curl<BookRequest>(
    "REQUEST-01-cancel",
    "POST",
    `/api/listings/${String(rejectListing._id)}/requests`,
    requesterId,
    201,
    {},
  );
  const cancelled = await curl<BookRequest>(
    "REQUEST-06",
    "PATCH",
    `/api/requests/${toCancel.id}/cancel`,
    requesterId,
    200,
    {},
  );
  assert.equal(cancelled.status, "Cancelled");

  const acceptCopy = await createCopy(ownerId, book, "Published");
  const acceptListing = await createListing(ownerId, acceptCopy._id, "Exchange", exchangeTerms);
  const offeredCopy = await createCopy(requesterId, offeredBook, "Available");
  const secondOffered = await createCopy(
    secondRequesterId,
    { ...offeredBook, catalogId: "/works/OL777W" },
    "Available",
  );

  const winningReq = await curl<BookRequest>(
    "REQUEST-01",
    "POST",
    `/api/listings/${String(acceptListing._id)}/requests`,
    requesterId,
    201,
    { offeredBookId: String(offeredCopy._id) },
  );
  const competingReq = await curl<BookRequest>(
    "REQUEST-01-competing",
    "POST",
    `/api/listings/${String(acceptListing._id)}/requests`,
    secondRequesterId,
    201,
    { offeredBookId: String(secondOffered._id) },
  );

  await curl(
    "REQUEST-02",
    "GET",
    "/api/requests?direction=received&status=Pending",
    ownerId,
    200,
  );
  await curl("REQUEST-03", "GET", `/api/requests/${winningReq.id}`, requesterId, 200);

  const accepted = await curl<BookRequest>(
    "REQUEST-04",
    "PATCH",
    `/api/requests/${winningReq.id}/accept`,
    ownerId,
    200,
    {},
  );
  assert.equal(accepted.status, "Accepted");

  const competingAfter = await curl<BookRequest>(
    "REQUEST-03-competing",
    "GET",
    `/api/requests/${competingReq.id}`,
    secondRequesterId,
    200,
  );
  assert.equal(competingAfter.status, "Rejected");
  assert.equal(competingAfter.rejectionReason, "CompetingRequestAccepted");

  const completed = await curl<BookRequest>(
    "REQUEST-07",
    "PATCH",
    `/api/requests/${winningReq.id}/complete`,
    ownerId,
    200,
    {},
  );
  assert.equal(completed.status, "Completed");
  assert.equal((await LibraryBookModel.findById(acceptCopy._id))?.status, "Transferred");
  assert.equal((await LibraryBookModel.findById(offeredCopy._id))?.status, "Transferred");
});


