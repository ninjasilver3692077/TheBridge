import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";
import jwt from "jsonwebtoken";
import mongoose, { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import type { BookMetadata, BookRequest, LibraryBook, Listing, ListingTerms, PageMeta } from "@/types";
import { AccountModel } from "../../models/Account.js";
import { LibraryBookModel } from "../../models/LibraryBook.js";
import { ListingModel } from "../../models/Listing.js";
import { RequestModel } from "../../models/Request.js";
import { createApp } from "../../server/app.js";

const secret = "payment-methods-integration-secret-32-bytes";
const book: BookMetadata = { catalogId: "/works/OL45804W", title: "Dune", author: "Frank Herbert", genre: "Science Fiction", coverUrl: null, year: 1965, publisher: null, isbn: "9780441172719", language: "eng" };
const sale: ListingTerms = { desiredBook: null, priceCop: 40000, durationDays: null, paymentMethods: ["Nequi", "Cash"] };
const loan: ListingTerms = { desiredBook: null, priceCop: null, durationDays: 14, paymentMethods: null };
let replSet: MongoMemoryReplSet;
let base = "";
let close: () => void = () => undefined;
let seller = "";
let buyer = "";

async function api<T = Record<string, unknown>>(method: string, path: string, actor: string, body?: unknown) {
  const headers: Record<string, string> = { authorization: `Bearer ${jwt.sign({}, secret, { subject: actor, expiresIn: 86400, algorithm: "HS256" })}` };
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(base + path, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, body: await response.json() as { data: T; meta: PageMeta; error: string } };
}

async function addCopy() {
  const result = await api<LibraryBook>("POST", "/api/my-books", seller, { book, condition: "Good condition", notes: "Clean copy" });
  assert.equal(result.status, 201);
  return result.body.data;
}

async function publish(modality: string, terms: unknown) {
  const copy = await addCopy();
  return api<Listing>("POST", "/api/listings", seller, { libraryBookId: copy.id, modality, terms });
}

async function insertListingPublishedBeforeMethods() {
  const copy = await addCopy();
  await LibraryBookModel.updateOne({ _id: copy.id }, { $set: { status: "Published" } }).exec();
  const inserted = await ListingModel.collection.insertOne({
    libraryBook: new Types.ObjectId(copy.id), owner: new Types.ObjectId(seller), book, condition: "Good condition",
    description: "Clean copy", modality: "Sale", terms: { desiredBook: null, priceCop: 30000, durationDays: null },
    status: "Available", closureReason: null, moderation: null, revision: 0, createdAt: new Date(), updatedAt: new Date(),
  });
  return String(inserted.insertedId);
}

before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = replSet.getUri();
  process.env.JWT_SECRET = secret;
  process.env.JWT_TTL_SECONDS = "86400";
  process.env.CLIENT_ORIGINS = "http://localhost:5173";
  await mongoose.connect(replSet.getUri());
  await AccountModel.init();
  await LibraryBookModel.init();
  await ListingModel.init();
  await RequestModel.init();
  seller = String((await AccountModel.create({ name: "Seller", role: "Member", email: "seller@example.invalid", passwordHash: "test-only" }))._id);
  buyer = String((await AccountModel.create({ name: "Buyer", role: "Member", email: "buyer@example.invalid", passwordHash: "test-only" }))._id);
  const server = createApp().listen(0);
  close = () => server.close();
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

beforeEach(async () => {
  await RequestModel.deleteMany({});
  await ListingModel.deleteMany({});
  await LibraryBookModel.collection.deleteMany({});
});

after(async () => {
  close();
  await mongoose.disconnect();
  await replSet.stop();
});

test("publishing a Sale records its methods and public reads expose them", async () => {
  const created = await publish("Sale", sale);
  assert.equal(created.status, 201);
  assert.deepEqual(created.body.data.terms.paymentMethods, ["Cash", "Nequi"]);
  const publicRead = await api<Listing>("GET", `/api/listings/${created.body.data.id}`, buyer);
  assert.deepEqual(publicRead.body.data.terms.paymentMethods, ["Cash", "Nequi"]);
  const loanListing = await publish("Loan", loan);
  assert.equal(loanListing.status, 201);
  assert.equal(loanListing.body.data.terms.paymentMethods, null);
});

test("publishing rejects missing, empty, duplicated or unknown Sale methods and methods on other modalities", async () => {
  for (const paymentMethods of [null, [], ["Cash", "Cash"], ["Paypal"]]) {
    const result = await publish("Sale", { ...sale, paymentMethods });
    assert.equal(result.status, 400);
    assert.match(result.body.error, /^terms\.paymentMethods:/);
  }
  const withoutMethods = { desiredBook: null, priceCop: 40000, durationDays: null };
  assert.equal((await publish("Sale", withoutMethods)).body.error, "terms.paymentMethods: required field.");
  for (const [modality, terms] of [
    ["Loan", { ...loan, paymentMethods: ["Cash"] }],
    ["Rental", { desiredBook: null, priceCop: 8000, durationDays: 7, paymentMethods: ["Cash"] }],
    ["Exchange", { desiredBook: null, priceCop: null, durationDays: null, paymentMethods: ["Cash"] }],
  ] as const) {
    const result = await publish(modality, terms);
    assert.equal(result.status, 400);
    assert.equal(result.body.error, "terms.paymentMethods: only allowed for Sale listings.");
  }
  assert.equal(await ListingModel.countDocuments({}), 0);
});

test("editing switches methods on and off with the modality", async () => {
  const listing = (await publish("Loan", loan)).body.data;
  assert.equal((await api("PATCH", `/api/listings/${listing.id}`, seller, { modality: "Sale", terms: { ...sale, paymentMethods: null } })).status, 400);
  const toSale = await api<Listing>("PATCH", `/api/listings/${listing.id}`, seller, { modality: "Sale", terms: { ...sale, paymentMethods: ["Daviplata"] } });
  assert.equal(toSale.status, 200);
  assert.deepEqual(toSale.body.data.terms.paymentMethods, ["Daviplata"]);
  const backToLoan = await api<Listing>("PATCH", `/api/listings/${listing.id}`, seller, { modality: "Loan", terms: loan });
  assert.equal(backToLoan.status, 200);
  assert.equal(backToLoan.body.data.terms.paymentMethods, null);
});

test("a Sale request must choose one of the listing's methods and the owner sees the choice", async () => {
  const listing = (await publish("Sale", sale)).body.data;
  const path = `/api/listings/${listing.id}/requests`;
  assert.equal((await api("POST", path, buyer, {})).body.error, "paymentMethod: choose one of the listing's payment methods.");
  assert.equal((await api("POST", path, buyer, { paymentMethod: "Daviplata" })).body.error, "paymentMethod: must be one of Cash, Nequi.");
  assert.equal((await api("POST", path, buyer, { paymentMethod: "nequi" })).status, 400);
  assert.equal(await RequestModel.countDocuments({}), 0);

  const created = await api<BookRequest>("POST", path, buyer, { paymentMethod: "Nequi" });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.quotedTerms.paymentMethod, "Nequi");
  assert.deepEqual(created.body.data.quotedTerms.paymentMethods, ["Cash", "Nequi"]);

  const received = await api<BookRequest[]>("GET", "/api/requests?direction=received", seller);
  assert.equal(received.body.data.length, 1);
  assert.equal(received.body.data[0]?.quotedTerms.paymentMethod, "Nequi");
  const detail = await api<BookRequest>("GET", `/api/requests/${created.body.data.id}`, seller);
  assert.equal(detail.body.data.quotedTerms.paymentMethod, "Nequi");

  const accepted = await api<BookRequest>("PATCH", `/api/requests/${created.body.data.id}/accept`, seller, {});
  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.data.quotedTerms.paymentMethod, "Nequi");
  const completed = await api<BookRequest>("PATCH", `/api/requests/${created.body.data.id}/complete`, seller, {});
  assert.equal(completed.status, 200);
  assert.equal(completed.body.data.quotedTerms.paymentMethod, "Nequi");
});

test("requests on other modalities reject a payment method", async () => {
  const listing = (await publish("Loan", loan)).body.data;
  const rejected = await api("POST", `/api/listings/${listing.id}/requests`, buyer, { paymentMethod: "Cash" });
  assert.equal(rejected.status, 400);
  assert.equal(rejected.body.error, "paymentMethod: this listing does not offer payment methods.");
  const created = await api<BookRequest>("POST", `/api/listings/${listing.id}/requests`, buyer, {});
  assert.equal(created.status, 201);
  assert.equal(created.body.data.quotedTerms.paymentMethod, null);
  assert.equal(created.body.data.quotedTerms.paymentMethods, null);
});

test("Sale listings published before payment methods keep working without a method", async () => {
  const listingId = await insertListingPublishedBeforeMethods();
  const publicRead = await api<Listing>("GET", `/api/listings/${listingId}`, buyer);
  assert.equal(publicRead.body.data.terms.paymentMethods, null);
  const path = `/api/listings/${listingId}/requests`;
  assert.equal((await api("POST", path, buyer, { paymentMethod: "Cash" })).status, 400);
  const created = await api<BookRequest>("POST", path, buyer, {});
  assert.equal(created.status, 201);
  assert.equal(created.body.data.quotedTerms.paymentMethod, null);
  assert.equal((await api("PATCH", `/api/requests/${created.body.data.id}/accept`, seller, {})).status, 200);
  assert.equal((await api("PATCH", `/api/requests/${created.body.data.id}/complete`, seller, {})).status, 200);

  const withdrawnId = await insertListingPublishedBeforeMethods();
  assert.equal((await api("DELETE", `/api/listings/${withdrawnId}`, seller)).status, 200);
});
