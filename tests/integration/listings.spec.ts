import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, mock, test } from "node:test";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";
import mongoose, { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import type { BookMetadata, LibraryBook, Listing, ListingStats, ListingTerms, PageMeta } from "@/types";
import { AccountModel } from "../../models/Account.js";
import { LibraryBookModel } from "../../models/LibraryBook.js";
import { ListingModel } from "../../models/Listing.js";
import { createApp } from "../../server/app.js";
import { requestLinks } from "../../server/requestLinks.js";
import { seedDemo } from "../../server/scripts/seed.js";

const secret = "listings-integration-secret-at-least-32-bytes";
const book: BookMetadata = { catalogId: "/works/OL45804W", title: "Dune", author: "Frank Herbert", genre: "Science Fiction", coverUrl: null, year: 1965, publisher: null, isbn: "9780441172719", language: "eng" };
const sale: ListingTerms = { desiredBook: null, priceCop: 40000, durationDays: null };
let repl: MongoMemoryReplSet;
let base = "";
let close: () => void = () => undefined;
let owner = "";
let stranger = "";
let admin = "";
const evidence: unknown[] = [];

async function api<T = Record<string, unknown>>(method: string, path: string, actor?: string, body?: unknown) {
  const headers: Record<string, string> = {};
  if (actor) headers.authorization = `Bearer ${jwt.sign({}, secret, { subject: actor, expiresIn: 86400, algorithm: "HS256" })}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(base + path, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const value = await response.json() as { data: T; meta: PageMeta; error: string; code: number };
  evidence.push({ method, path, status: response.status, body: value });
  return { status: response.status, body: value, headers: response.headers };
}

async function add(actor = owner, metadata = book) {
  const result = await api<LibraryBook>("POST", "/api/my-books", actor, { book: metadata, condition: "Good condition", notes: "Original notes" });
  assert.equal(result.status, 201);
  return result.body.data;
}

async function publish(copyId: string, modality = "Sale", terms = sale) {
  const result = await api<Listing>("POST", "/api/listings", owner, { libraryBookId: copyId, modality, terms });
  assert.equal(result.status, 201);
  return result.body.data;
}

before(async () => {
  repl = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = repl.getUri();
  process.env.JWT_SECRET = secret;
  process.env.JWT_TTL_SECONDS = "86400";
  process.env.CLIENT_ORIGINS = "http://localhost:5173";
  await mongoose.connect(repl.getUri());
  await AccountModel.init();
  await LibraryBookModel.init();
  await ListingModel.init();
  for (const [name, role] of [["Owner", "Member"], ["Other", "Member"], ["Administrator", "Admin"]] as const) {
    const doc = await AccountModel.create({ name, role, email: `${name.toLowerCase()}@example.invalid`, passwordHash: "test-only-not-used-for-login" });
    if (name === "Owner") owner = String(doc._id);
    else if (name === "Other") stranger = String(doc._id);
    else admin = String(doc._id);
  }
  const server = createApp().listen(0);
  close = () => server.close();
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

beforeEach(async () => {
  await ListingModel.deleteMany({});
  await LibraryBookModel.deleteMany({});
  await requestLinks().deleteMany({});
});

after(async () => {
  if (process.env.THEBRIDGE_EVIDENCE_FILE) writeFileSync(process.env.THEBRIDGE_EVIDENCE_FILE, JSON.stringify({ environment: "Local HTTP API with real single-node MongoDB replica set; not Atlas or Vercel", evidence }, null, 2));
  close();
  await mongoose.disconnect();
  await repl?.stop();
});

test("COPY-01..05: ownership, editing, private projection and tombstone history", async () => {
  const copy = await add();
  assert.equal(copy.currentListing, null);
  assert.equal(copy.activity, null);
  assert.equal("owner" in copy, false);
  assert.equal("revision" in copy, false);
  const list = await api<LibraryBook[]>("GET", "/api/my-books?limit=1", owner);
  assert.equal(list.status, 200);
  assert.equal(list.body.meta.total, 1);
  assert.equal(list.headers.get("cache-control"), "no-store");
  assert.equal((await api("GET", `/api/my-books/${copy.id}`, stranger)).status, 404);
  assert.equal((await api("PATCH", `/api/my-books/${copy.id}`, stranger, { notes: "wrong" })).status, 404);
  const edited = await api<LibraryBook>("PATCH", `/api/my-books/${copy.id}`, owner, { notes: "Revised", condition: "Like new" });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.data.notes, "Revised");
  assert.equal((await api("DELETE", `/api/my-books/${copy.id}`, stranger)).status, 404);
  assert.equal((await api("DELETE", `/api/my-books/${copy.id}`, owner)).status, 200);
  assert.equal((await api("GET", `/api/my-books/${copy.id}`, owner)).status, 404);
  assert.equal((await api<LibraryBook[]>("GET", "/api/my-books?status=Available", owner)).body.meta.total, 0);
  const stored = await LibraryBookModel.collection.findOne({ _id: new Types.ObjectId(copy.id) });
  assert.ok(stored?.deletedAt instanceof Date);
  assert.equal((await api("DELETE", `/api/my-books/${copy.id}`, owner)).status, 404);
});

test("validation: role gates, malformed IDs, unknown fields, metadata and term boundaries", async () => {
  assert.equal((await api("GET", "/api/my-books")).status, 401);
  assert.equal((await api("GET", "/api/my-books", admin)).status, 403);
  assert.equal((await api("GET", "/api/my-books/bad", owner)).status, 400);
  assert.equal((await api("GET", `/api/my-books/${new Types.ObjectId()}`, owner)).status, 404);
  const invalid = await api("POST", "/api/my-books", owner, { book: { ...book, title: "" }, condition: "Like new" });
  assert.equal(invalid.status, 400);
  assert.match(invalid.body.error, /book.title/);
  assert.equal((await api("POST", "/api/my-books", owner, { book, condition: "Like new", owner })).status, 400);
  const copy = await add();
  assert.equal((await api("PATCH", `/api/my-books/${copy.id}`, owner, {})).status, 400);
  assert.equal((await api("PATCH", `/api/my-books/${copy.id}`, owner, { status: "Published" })).status, 400);
  assert.equal((await api("POST", "/api/listings", owner, { libraryBookId: copy.id, modality: "Sale", terms: { ...sale, priceCop: 0 } })).status, 400);
  assert.equal((await api("POST", "/api/listings", owner, { libraryBookId: copy.id, modality: "Loan", terms: sale })).status, 400);
  assert.equal((await api("POST", "/api/listings", stranger, { libraryBookId: copy.id, modality: "Sale", terms: sale })).status, 404);
  const unsupported = await api("PUT", `/api/listings/${copy.id}`, undefined, {});
  assert.equal(unsupported.status, 405);
  assert.match(unsupported.headers.get("allow") ?? "", /GET/);
  assert.equal((await api("GET", "/api/listings/stats?page=1")).status, 400);
  assert.equal((await api("GET", "/api/listings?modality=bad")).status, 400);
  assert.equal((await api("GET", "/api/listings?condition=bad")).status, 400);
  assert.equal((await api("GET", "/api/listings?limit=0")).status, 400);
  assert.equal((await api("GET", "/api/my-books?status=bad", owner)).status, 400);
  assert.equal((await api("GET", "/api/listings?q=a&q=b")).status, 400);
});

test("LISTING-01..07: snapshot, safe populate, currentListing, terms edit and withdrawal", async () => {
  const copy = await add();
  const listing = await publish(copy.id);
  assert.deepEqual(Object.keys(listing.owner).sort(), ["id", "name"]);
  assert.equal(listing.description, "Original notes");
  assert.equal(listing.condition, "Good condition");
  assert.equal("revision" in listing, false);
  assert.equal("moderation" in listing, false);
  const detail = await api<LibraryBook>("GET", `/api/my-books/${copy.id}`, owner);
  assert.equal(detail.body.data.status, "Published");
  assert.equal(detail.body.data.currentListing?.id, listing.id);
  assert.equal((await api("PATCH", `/api/my-books/${copy.id}`, owner, { notes: "overwrite" })).status, 409);
  assert.equal((await api("DELETE", `/api/my-books/${copy.id}`, owner)).status, 409);
  assert.equal((await api("POST", "/api/listings", owner, { libraryBookId: copy.id, modality: "Sale", terms: sale })).status, 409);
  assert.equal((await api("PATCH", `/api/listings/${listing.id}`, stranger, { modality: "Sale", terms: sale })).status, 403);
  const edit = await api<Listing>("PATCH", `/api/listings/${listing.id}`, owner, { modality: "Loan", terms: { desiredBook: null, priceCop: null, durationDays: 14 } });
  assert.equal(edit.status, 200);
  assert.equal(edit.body.data.modality, "Loan");
  assert.equal((await api<Listing[]>("GET", "/api/listings/mine", owner)).body.data.length, 1);
  const withdrawn = await api<Listing>("DELETE", `/api/listings/${listing.id}`, owner);
  assert.equal(withdrawn.status, 200);
  assert.equal(withdrawn.body.data.status, "Closed");
  assert.equal(withdrawn.body.data.closureReason, "Withdrawn");
  assert.equal((await api<Listing>("GET", `/api/listings/${listing.id}`)).status, 200);
  assert.equal((await api<Listing[]>("GET", "/api/listings")).body.meta.total, 0);
  assert.equal((await api<LibraryBook>("GET", `/api/my-books/${copy.id}`, owner)).body.data.currentListing, null);
  assert.equal((await api("DELETE", `/api/listings/${listing.id}`, owner)).status, 409);
  await api("PATCH", `/api/my-books/${copy.id}`, owner, { notes: "New snapshot" });
  const next = await publish(copy.id);
  assert.notEqual(next.id, listing.id);
  assert.equal((await api<Listing>("GET", `/api/listings/${listing.id}`)).body.data.description, "Original notes");
});

test("search and stats: accent-insensitive search, filters, full totals, global facets and empty pages", async () => {
  await publish((await add()).id);
  await publish((await add(owner, { ...book, catalogId: "/works/OL2W", title: "Cien a\u00f1os", author: "Gabriel Garc\u00eda M\u00e1rquez", genre: "Classic" })).id, "Rental", { desiredBook: null, priceCop: 10001, durationDays: 7 });
  await publish((await add(owner, { ...book, catalogId: "/works/OL3W", title: "Another" })).id, "Sale", { ...sale, priceCop: 40001 });
  assert.equal((await api<Listing[]>("GET", "/api/listings?limit=1")).body.meta.total, 3);
  assert.equal((await api<Listing[]>("GET", "/api/listings?q=garcia")).body.meta.total, 1);
  assert.equal((await api<Listing[]>("GET", "/api/listings?q=9780441172719")).body.meta.total, 3);
  assert.equal((await api<Listing[]>("GET", "/api/listings?q=%5B")).body.meta.total, 0);
  const filtered = await api<Listing[]>("GET", "/api/listings?modality=Rental&genre=Classic&condition=Good%20condition");
  assert.equal(filtered.body.meta.total, 1);
  const stats = (await api<ListingStats>("GET", "/api/listings/stats?modality=Sale")).body.data;
  assert.equal(stats.total, 2);
  assert.equal(stats.averageSalePriceCop, 40001);
  assert.equal(stats.averageRentalPriceCop, null);
  assert.deepEqual(stats.facets.genres, ["Classic", "Science Fiction"]);
  assert.deepEqual(stats.byModality, { Exchange: 0, Loan: 0, Rental: 0, Sale: 2 });
  const empty = await api<Listing[]>("GET", "/api/listings?page=99");
  assert.equal(empty.body.meta.total, 3);
  assert.deepEqual(empty.body.data, []);
  assert.equal((await api<ListingStats>("GET", "/api/listings/stats?q=unmatched")).body.data.total, 0);
});

test("Pending blocks even identical edits; withdrawal rejects atomically and preserves history", async () => {
  const copy = await add();
  const listing = await publish(copy.id);
  const pending = await requestLinks().insertOne({ listing: new Types.ObjectId(listing.id), offeredBook: null, owner: new Types.ObjectId(owner), requester: new Types.ObjectId(stranger), status: "Pending", listingSummary: { status: "Available" }, updatedAt: new Date() });
  assert.equal((await api("PATCH", `/api/listings/${listing.id}`, owner, { modality: "Sale", terms: sale })).status, 409);
  assert.equal((await ListingModel.findById(listing.id).exec())?.terms.priceCop, sale.priceCop);
  assert.equal((await api("DELETE", `/api/listings/${listing.id}`, owner)).status, 200);
  const request = await requestLinks().findOne({ _id: pending.insertedId });
  assert.equal(request?.status, "Rejected");
  assert.equal(request?.rejectionReason, "ListingWithdrawn");
  assert.equal((await LibraryBookModel.findById(copy.id).exec())?.status, "Available");
  assert.equal((await api("DELETE", `/api/my-books/${copy.id}`, owner)).status, 200);
  assert.ok(await requestLinks().findOne({ _id: pending.insertedId }));
});

test("outgoing offers block copy edit/delete/publish and rollback leaves states unchanged", async () => {
  const copy = await add();
  const offered = await requestLinks().insertOne({ listing: new Types.ObjectId(), offeredBook: new Types.ObjectId(copy.id), owner: new Types.ObjectId(stranger), requester: new Types.ObjectId(owner), status: "Pending", updatedAt: new Date() });
  assert.equal((await api("PATCH", `/api/my-books/${copy.id}`, owner, { notes: "changed" })).status, 409);
  assert.equal((await api("DELETE", `/api/my-books/${copy.id}`, owner)).status, 409);
  assert.equal((await api("POST", "/api/listings", owner, { libraryBookId: copy.id, modality: "Sale", terms: sale })).status, 409);
  assert.equal((await LibraryBookModel.findById(copy.id).exec())?.notes, "Original notes");
  assert.equal(await ListingModel.countDocuments(), 0);
  await requestLinks().updateOne({ _id: offered.insertedId }, { $set: { status: "Cancelled" } });
  const listing = await publish(copy.id);
  await LibraryBookModel.updateOne({ _id: copy.id }, { $set: { status: "Lent" } });
  assert.equal((await api("DELETE", `/api/listings/${listing.id}`, owner)).status, 409);
  assert.equal((await ListingModel.findById(listing.id).exec())?.status, "Available");
});

test("publication races allow one winner and reject the duplicate without orphan listings", async () => {
  const copy = await add();
  const results = await Promise.all([1, 2].map(() => api("POST", "/api/listings", owner, { libraryBookId: copy.id, modality: "Sale", terms: sale })));
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
  assert.equal(await ListingModel.countDocuments({ libraryBook: copy.id }), 1);
  assert.equal((await LibraryBookModel.findById(copy.id).exec())?.status, "Published");
});

test("shared request protocol: a concurrent Pending insertion blocks listing editing after retry", async () => {
  const listing = await publish((await add()).id);
  const session = await mongoose.connection.startSession();
  session.startTransaction();
  await ListingModel.updateOne({ _id: listing.id }, { $inc: { revision: 1 } }, { session });
  await requestLinks().insertOne({ listing: new Types.ObjectId(listing.id), offeredBook: null, owner: new Types.ObjectId(owner), requester: new Types.ObjectId(stranger), status: "Pending", updatedAt: new Date() }, { session });
  const pending = api("PATCH", `/api/listings/${listing.id}`, owner, { modality: "Sale", terms: { ...sale, priceCop: 50000 } });
  await new Promise((resolve) => setTimeout(resolve, 200));
  await session.commitTransaction();
  await session.endSession();
  assert.equal((await pending).status, 409);
  assert.equal((await ListingModel.findById(listing.id).exec())?.terms.priceCop, 40000);
});

test("shared offer protocol: concurrent offers block publishing, editing and deleting a copy", async () => {
  for (const method of ["POST", "PATCH", "DELETE"]) {
    const copy = await add();
    const session = await mongoose.connection.startSession();
    session.startTransaction();
    await LibraryBookModel.updateOne({ _id: copy.id }, { $inc: { revision: 1 } }, { session });
    await requestLinks().insertOne({ listing: new Types.ObjectId(), offeredBook: new Types.ObjectId(copy.id), owner: new Types.ObjectId(stranger), requester: new Types.ObjectId(owner), status: "Pending", updatedAt: new Date() }, { session });
    const path = method === "POST" ? "/api/listings" : `/api/my-books/${copy.id}`;
    const input = method === "POST" ? { libraryBookId: copy.id, modality: "Sale", terms: sale } : method === "PATCH" ? { notes: "race" } : undefined;
    const result = api(method, path, owner, input);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await session.commitTransaction();
    await session.endSession();
    assert.equal((await result).status, 409);
    assert.equal((await LibraryBookModel.findById(copy.id))?.status, "Available");
  }
});

test("Removed privacy, Transferred history, and model field validation", async () => {
  const copy = await add();
  const listing = await publish(copy.id);
  await ListingModel.updateOne({ _id: listing.id }, { $set: { status: "Removed", moderation: { reason: "Private reason", removedAt: new Date(), removedBy: admin } } });
  assert.equal((await api("GET", `/api/listings/${listing.id}`)).status, 404);
  const mine = await api<Array<Listing & { moderation: { reason: string } }>>("GET", "/api/listings/mine?status=Removed", owner);
  assert.equal(mine.body.data[0]?.moderation.reason, "Private reason");
  assert.equal((await api<Listing[]>("GET", "/api/listings/mine", stranger)).body.meta.total, 0);
  await LibraryBookModel.updateOne({ _id: copy.id }, { $set: { status: "Transferred" } });
  assert.equal((await api<LibraryBook[]>("GET", "/api/my-books", owner)).body.meta.total, 0);
  assert.equal((await api<LibraryBook[]>("GET", "/api/my-books?status=Transferred", owner)).body.meta.total, 1);
  await assert.rejects(new LibraryBookModel({ owner, book, condition: "Invalid" }).validate(), /condition/);
  await assert.rejects(new ListingModel({ owner, libraryBook: copy.id, book, condition: "Like new", modality: "Sale", terms: { ...sale, priceCop: 0 } }).validate(), /terms/);
});

test("seed is idempotent, creates demo Members and all modalities without resets", async () => {
  const first = await seedDemo("isolated-demo-test-password");
  assert.deepEqual(first, { members: 3, listingsCreated: 4 });
  const accountBefore = await AccountModel.findOne({ email: "demo1@thebridge.example.invalid" }).select("+passwordHash").exec();
  assert.match(accountBefore?.passwordHash ?? "", /^\$2[aby]\$12\$/);
  const second = await seedDemo("different-password-does-not-reset-existing");
  assert.equal(second.listingsCreated, 0);
  const accountAfter = await AccountModel.findOne({ email: "demo1@thebridge.example.invalid" }).select("+passwordHash").exec();
  assert.equal(accountAfter?.passwordHash, accountBefore?.passwordHash);
  assert.equal(await ListingModel.countDocuments({ status: "Available" }), 4);
  assert.equal(await LibraryBookModel.countDocuments({ status: "Published" }), 4);
  assert.deepEqual((await ListingModel.distinct("modality")).sort(), ["Exchange", "Loan", "Rental", "Sale"]);
});

test("curl evidence executes every COPY and LISTING endpoint against the real local replica set", async () => {
  const run = promisify(execFile);
  const token = jwt.sign({}, secret, { subject: owner, expiresIn: 86400, algorithm: "HS256" });
  async function curl<T>(operation: string, method: string, path: string, expected: number, body?: unknown) {
    const args = ["--silent", "--show-error", "--max-time", "15", "--write-out", "\n%{http_code}", "--request", method, "--header", `Authorization: Bearer ${token}`];
    if (body !== undefined) args.push("--header", "Content-Type: application/json", "--data-binary", JSON.stringify(body));
    args.push(base + path);
    const { stdout } = await run(process.platform === "win32" ? "curl.exe" : "curl", args, { windowsHide: true });
    const boundary = stdout.lastIndexOf("\n");
    const status = Number(stdout.slice(boundary + 1));
    const result = JSON.parse(stdout.slice(0, boundary)) as { data: T };
    assert.equal(status, expected, operation);
    evidence.push({ tool: "curl", operation, method, path, status, body: result });
    return result.data;
  }
  const copy = await curl<LibraryBook>("COPY-03", "POST", "/api/my-books", 201, { book, condition: "Like new" });
  await curl("COPY-01", "GET", "/api/my-books", 200);
  await curl("COPY-02", "GET", `/api/my-books/${copy.id}`, 200);
  await curl("COPY-04", "PATCH", `/api/my-books/${copy.id}`, 200, { notes: "curl evidence snapshot" });
  const listing = await curl<Listing>("LISTING-05", "POST", "/api/listings", 201, { libraryBookId: copy.id, modality: "Sale", terms: sale });
  await curl("LISTING-01", "GET", "/api/listings", 200);
  await curl("LISTING-02", "GET", "/api/listings/stats", 200);
  await curl("LISTING-03", "GET", "/api/listings/mine", 200);
  await curl("LISTING-04", "GET", `/api/listings/${listing.id}`, 200);
  await curl("LISTING-06", "PATCH", `/api/listings/${listing.id}`, 200, { modality: "Sale", terms: { ...sale, priceCop: 45000 } });
  await curl("LISTING-07", "DELETE", `/api/listings/${listing.id}`, 200);
  await curl("COPY-05", "DELETE", `/api/my-books/${copy.id}`, 200);
});

test("missing or invalid terms identify the nested field rather than a valid request body", async () => {
  const copy = await add();
  for (const terms of [undefined, null, [], "invalid"]) {
    const result = await api("POST", "/api/listings", owner, { libraryBookId: copy.id, modality: "Sale", ...(terms === undefined ? {} : { terms }) });
    assert.equal(result.status, 400);
    assert.match(result.body.error, /^terms:/);
  }
  const unknown = await api("POST", "/api/listings", owner, { libraryBookId: copy.id, modality: "Sale", terms: { ...sale, owner } });
  assert.equal(unknown.status, 400);
  assert.match(unknown.body.error, /^terms.owner:/);
});

test("all modality terms validate through HTTP and Reserved listings cannot be edited or withdrawn", async () => {
  const cases = [
    { modality: "Exchange", terms: { desiredBook: book, priceCop: null, durationDays: null } },
    { modality: "Loan", terms: { desiredBook: null, priceCop: null, durationDays: 21 } },
    { modality: "Rental", terms: { desiredBook: null, priceCop: 1_000_000_000, durationDays: 7 } },
    { modality: "Sale", terms: { desiredBook: null, priceCop: 1, durationDays: null } },
  ] as const;
  for (const input of cases) {
    const copy = await add();
    const created = await api<Listing>("POST", "/api/listings", owner, { libraryBookId: copy.id, ...input });
    assert.equal(created.status, 201);
    assert.deepEqual(created.body.data.terms, input.terms);
    await ListingModel.updateOne({ _id: created.body.data.id }, { $set: { status: "Reserved" } });
    const copyStatus = input.modality === "Loan" || input.modality === "Rental" ? "Lent" : "Reserved";
    await LibraryBookModel.updateOne({ _id: copy.id }, { $set: { status: copyStatus } });
    const privateRead = await api("PATCH", `/api/listings/${created.body.data.id}`, owner, input);
    assert.equal(privateRead.status, 409);
    assert.equal((await api("DELETE", `/api/listings/${created.body.data.id}`, owner)).status, 409);
    assert.equal((await ListingModel.findById(created.body.data.id))?.status, "Reserved");
    assert.equal((await LibraryBookModel.findById(copy.id))?.status, copyStatus);
  }
  const copy = await add();
  for (const terms of [{ ...sale, priceCop: 1_000_000_001 }, { ...sale, priceCop: 1.5 }, { ...sale, priceCop: "40000" }, { ...sale, durationDays: 14 }]) {
    assert.equal((await api("POST", "/api/listings", owner, { libraryBookId: copy.id, modality: "Sale", terms })).status, 400);
  }
});

test("a database rejection midway through withdrawal rolls back listing, copy and Pending requests", async () => {
  const copy = await add();
  const listing = await publish(copy.id);
  const pending = await requestLinks().insertOne({ listing: new Types.ObjectId(listing.id), offeredBook: null, owner: new Types.ObjectId(owner), requester: new Types.ObjectId(stranger), status: "Pending", updatedAt: new Date() });
  const db = mongoose.connection.db;
  assert.ok(db);
  const original = await ListingModel.findById(listing.id).select("+revision").exec();
  await db.command({ collMod: "requests", validator: { status: "Pending" }, validationLevel: "strict", validationAction: "error" });
  const errorLog = mock.method(console, "error", () => undefined);
  try {
    const failed = await api("DELETE", `/api/listings/${listing.id}`, owner);
    assert.equal(failed.status, 500);
    assert.deepEqual(failed.body, { error: "Unexpected server error.", code: 500 });
    assert.equal(errorLog.mock.callCount(), 1);
    const unchanged = await ListingModel.findById(listing.id).select("+revision").exec();
    assert.equal(unchanged?.status, "Available");
    assert.equal(unchanged?.closureReason, null);
    assert.equal(unchanged?.revision, original?.revision);
    assert.equal((await LibraryBookModel.findById(copy.id))?.status, "Published");
    assert.equal((await requestLinks().findOne({ _id: pending.insertedId }))?.status, "Pending");
  } finally {
    errorLog.mock.restore();
    await db.command({ collMod: "requests", validator: {} });
  }
  assert.equal((await api("DELETE", `/api/listings/${listing.id}`, owner)).status, 200);
  assert.equal((await requestLinks().findOne({ _id: pending.insertedId }))?.status, "Rejected");
});
