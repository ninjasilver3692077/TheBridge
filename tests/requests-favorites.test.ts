import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, afterEach, before, beforeEach, mock, test } from "node:test";
import jwt from "jsonwebtoken";
import mongoose, { Types } from "mongoose";
import type { BookMetadata, Condition, ListingStatus, ListingTerms, Modality, RequestQuotedTerms, Role } from "@/types";
import { AccountModel } from "../models/Account.js";
import { FavoriteModel } from "../models/Favorite.js";
import { LibraryBookModel } from "../models/LibraryBook.js";
import { ListingModel } from "../models/Listing.js";
import { RequestModel } from "../models/Request.js";
import { createApp } from "../server/app.js";

const jwtSecret = "test-jwt-secret-with-at-least-32-bytes!!";

const ownerId = "507f1f77bcf86cd799439011";
const requesterId = "507f1f77bcf86cd799439012";
const outsiderId = "507f1f77bcf86cd799439013";
const adminId = "507f1f77bcf86cd799439014";

const ownerCopyId = "507f1f77bcf86cd799439021";
const offeredCopyId = "507f1f77bcf86cd799439022";
const listingId = "507f1f77bcf86cd799439031";

const sampleBook: BookMetadata = {
  catalogId: "/works/OL45804W",
  title: "Dune",
  author: "Frank Herbert",
  genre: "Science Fiction",
  coverUrl: "https://covers.openlibrary.org/b/id/8231856-L.jpg",
  year: 1965,
  publisher: "Chilton Books",
  isbn: "9780441172719",
  language: "eng",
};

const offeredBookMeta: BookMetadata = {
  catalogId: "/works/OL1168083W",
  title: "1984",
  author: "George Orwell",
  genre: "Dystopian",
  coverUrl: "https://covers.openlibrary.org/b/id/7222246-L.jpg",
  year: 1949,
  publisher: "Secker & Warburg",
  isbn: "9780451524935",
  language: "eng",
};

interface StoredAccount {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: Role;
}

interface StoredCopy {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  book: BookMetadata;
  condition: Condition;
  notes: string;
  status: "Available" | "Published" | "Reserved" | "Lent" | "Transferred";
  save: () => Promise<StoredCopy>;
}

interface StoredListing {
  _id: Types.ObjectId;
  libraryBook: Types.ObjectId;
  owner: Types.ObjectId;
  book: BookMetadata;
  condition: Condition;
  description: string;
  modality: Modality;
  terms: ListingTerms;
  status: ListingStatus;
  closureReason: "Withdrawn" | "Completed" | null;
  save: () => Promise<StoredListing>;
}

interface StoredRequest {
  _id: Types.ObjectId;
  listing: unknown;
  owner: unknown;
  requester: unknown;
  offeredBook: Types.ObjectId | null;
  offeredBookSnapshot: { id: string; book: BookMetadata; condition: Condition } | null;
  listingSummary: {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
    modality: Modality;
    status: ListingStatus;
  };
  status: "Pending" | "Accepted" | "Rejected" | "Cancelled" | "Completed";
  rejectionReason:
    | "OwnerRejected"
    | "CompetingRequestAccepted"
    | "ListingWithdrawn"
    | "ListingRemoved"
    | null;
  quotedModality: Modality;
  quotedTerms: RequestQuotedTerms;
  createdAt: Date;
  updatedAt: Date;
  save: () => Promise<StoredRequest>;
  populate: () => Promise<StoredRequest>;
}

interface StoredFavorite {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  book: BookMetadata;
  createdAt: Date;
  updatedAt: Date;
}

let baseUrl = "";
let closeServer: () => void = () => undefined;

let accounts = new Map<string, StoredAccount>();
let copies = new Map<string, StoredCopy>();
let listings = new Map<string, StoredListing>();
let requests = new Map<string, StoredRequest>();
let favorites = new Map<string, StoredFavorite>();

function signToken(sub: string, role: Role = "Member"): string {
  return jwt.sign({ sub, role }, jwtSecret, { algorithm: "HS256", expiresIn: 3600 });
}

function makeChain<T>(value: T) {
  const chain = {
    select: () => chain,
    session: () => chain,
    sort: () => chain,
    skip: () => chain,
    limit: () => chain,
    populate: () => chain,
    exec: async () => value,
  };
  return chain;
}

function makeCopy(
  id: string,
  owner: string,
  book: BookMetadata,
  status: StoredCopy["status"],
): StoredCopy {
  const copy: StoredCopy = {
    _id: new Types.ObjectId(id),
    owner: new Types.ObjectId(owner),
    book,
    condition: "Good condition",
    notes: "",
    status,
    save: async () => {
      copies.set(id, copy);
      return copy;
    },
  };
  return copy;
}

function makeListing(
  id: string,
  modality: Modality,
  terms: ListingTerms,
  status: ListingStatus = "Available",
): StoredListing {
  const listing: StoredListing = {
    _id: new Types.ObjectId(id),
    libraryBook: new Types.ObjectId(ownerCopyId),
    owner: new Types.ObjectId(ownerId),
    book: sampleBook,
    condition: "Good condition",
    description: "Clean edition",
    modality,
    terms,
    status,
    closureReason: null,
    save: async () => {
      listings.set(id, listing);
      return listing;
    },
  };
  return listing;
}

function attachRequestMethods(reqDoc: StoredRequest): StoredRequest {
  reqDoc.save = async () => {
    reqDoc.updatedAt = new Date();
    requests.set(String(reqDoc._id), reqDoc);
    return reqDoc;
  };
  reqDoc.populate = async () => {
    const ownerKey =
      typeof reqDoc.owner === "object" && reqDoc.owner !== null && "_id" in reqDoc.owner
        ? String((reqDoc.owner as { _id: unknown })._id)
        : String(reqDoc.owner);
    const requesterKey =
      typeof reqDoc.requester === "object" && reqDoc.requester !== null && "_id" in reqDoc.requester
        ? String((reqDoc.requester as { _id: unknown })._id)
        : String(reqDoc.requester);
    const listingKey =
      typeof reqDoc.listing === "object" && reqDoc.listing !== null && "_id" in reqDoc.listing
        ? String((reqDoc.listing as { _id: unknown })._id)
        : String(reqDoc.listing);

    const ownerAcc = accounts.get(ownerKey);
    const requesterAcc = accounts.get(requesterKey);
    const listingDoc = listings.get(listingKey);

    if (ownerAcc) reqDoc.owner = { _id: ownerAcc._id, name: ownerAcc.name };
    if (requesterAcc) reqDoc.requester = { _id: requesterAcc._id, name: requesterAcc.name };
    if (listingDoc) reqDoc.listing = { _id: listingDoc._id, status: listingDoc.status };
    return reqDoc;
  };
  return reqDoc;
}

function rawIdOf(value: unknown): string {
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

before(() => {
  Object.defineProperty(mongoose.connection, "readyState", {
    get: () => 1,
    configurable: true,
  });
  process.env.MONGODB_URI = "mongodb://localhost/test";
  process.env.CLIENT_ORIGINS = "http://localhost:5173";
  process.env.JWT_SECRET = jwtSecret;
  const server = createApp().listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  closeServer = () => server.close();
});

after(() => closeServer());

beforeEach(() => {
  accounts = new Map([
    [
      ownerId,
      {
        _id: new Types.ObjectId(ownerId),
        name: "Laura Gomez",
        email: "laura@example.edu",
        role: "Member",
      },
    ],
    [
      requesterId,
      {
        _id: new Types.ObjectId(requesterId),
        name: "Andres Perez",
        email: "andres@example.edu",
        role: "Member",
      },
    ],
    [
      outsiderId,
      {
        _id: new Types.ObjectId(outsiderId),
        name: "Mateo Ruiz",
        email: "mateo@example.edu",
        role: "Member",
      },
    ],
    [
      adminId,
      {
        _id: new Types.ObjectId(adminId),
        name: "Camila Admin",
        email: "admin@example.edu",
        role: "Admin",
      },
    ],
  ]);

  copies = new Map([
    [ownerCopyId, makeCopy(ownerCopyId, ownerId, sampleBook, "Published")],
    [offeredCopyId, makeCopy(offeredCopyId, requesterId, offeredBookMeta, "Available")],
  ]);

  listings = new Map([
    [
      listingId,
      makeListing(listingId, "Loan", {
        desiredBook: null,
        priceCop: null,
        durationDays: 14,
        paymentMethods: null,
      }),
    ],
  ]);

  requests = new Map();
  favorites = new Map();

  mock.method(
    mongoose.connection,
    "transaction",
    async <T>(fn: (session: mongoose.ClientSession) => Promise<T>): Promise<T> =>
      fn({} as mongoose.ClientSession),
  );

  mock.method(AccountModel, "findById", (id: unknown) =>
    makeChain(accounts.get(String(id)) ?? null),
  );

  mock.method(AccountModel, "find", (filter: Record<string, unknown>) => {
    const nameRegex = filter.name as RegExp | undefined;
    const matched = [...accounts.values()].filter((acc) =>
      nameRegex ? nameRegex.test(acc.name) : true,
    );
    return makeChain(matched);
  });

  mock.method(LibraryBookModel, "findById", (id: unknown) =>
    makeChain(copies.get(String(id)) ?? null),
  );

  mock.method(ListingModel, "findById", (id: unknown) =>
    makeChain(listings.get(String(id)) ?? null),
  );

  mock.method(ListingModel, "updateOne", (filter: Record<string, unknown>) => {
    const target = listings.get(String(filter._id));
    const matched = target !== undefined && target.status === filter.status ? 1 : 0;
    return makeChain({ matchedCount: matched });
  });

  mock.method(LibraryBookModel, "updateOne", (filter: Record<string, unknown>) => {
    const target = copies.get(String(filter._id));
    const matched =
      target !== undefined &&
      target.status === filter.status &&
      String(target.owner) === String(filter.owner)
        ? 1
        : 0;
    return makeChain({ matchedCount: matched });
  });

  mock.method(ListingModel, "findOne", (filter: Record<string, unknown>) => {
    const libId = String(filter.libraryBook ?? "");
    const found = [...listings.values()].find(
      (item) =>
        String(item.libraryBook) === libId &&
        (item.status === "Available" || item.status === "Reserved"),
    );
    return makeChain(found ?? null);
  });

  mock.method(FavoriteModel, "findOne", (filter: Record<string, unknown>) => {
    const owner = String(filter.owner ?? "");
    const catalogId = String(filter["book.catalogId"] ?? "");
    const found = [...favorites.values()].find(
      (fav) => String(fav.owner) === owner && fav.book.catalogId === catalogId,
    );
    return makeChain(found ?? null);
  });

  mock.method(FavoriteModel, "create", async (input: unknown) => {
    const data = input as { owner: string; book: BookMetadata };
    const id = new Types.ObjectId();
    const now = new Date();
    const doc: StoredFavorite = {
      _id: id,
      owner: new Types.ObjectId(data.owner),
      book: data.book,
      createdAt: now,
      updatedAt: now,
    };
    favorites.set(String(id), doc);
    return doc as never;
  });

  mock.method(FavoriteModel, "countDocuments", (filter: Record<string, unknown>) => {
    const owner = String(filter.owner ?? "");
    const list = [...favorites.values()].filter((fav) => String(fav.owner) === owner);
    return makeChain(list.length);
  });

  mock.method(FavoriteModel, "find", (filter: Record<string, unknown>) => {
    const owner = String(filter.owner ?? "");
    const list = [...favorites.values()].filter((fav) => String(fav.owner) === owner);
    return makeChain(list);
  });

  mock.method(FavoriteModel, "findOneAndDelete", (filter: Record<string, unknown>) => {
    const id = String(filter._id ?? "");
    const owner = String(filter.owner ?? "");
    const existing = favorites.get(id);
    if (!existing || String(existing.owner) !== owner) {
      return makeChain(null);
    }
    favorites.delete(id);
    return makeChain(existing);
  });

  mock.method(RequestModel, "findOne", (filter: Record<string, unknown>) => {
    const matched = [...requests.values()].find((item) => {
      if (filter.listing && rawIdOf(item.listing) !== String(filter.listing)) return false;
      if (filter.requester && rawIdOf(item.requester) !== String(filter.requester)) return false;
      if (filter.offeredBook && String(item.offeredBook) !== String(filter.offeredBook)) {
        return false;
      }
      if (filter.status && typeof filter.status === "object" && "$in" in filter.status) {
        const allowed = (filter.status as { $in: string[] }).$in;
        if (!allowed.includes(item.status)) return false;
      }
      return true;
    });
    return makeChain(matched ?? null);
  });

  mock.method(RequestModel, "create", async (docs: unknown) => {
    const items = Array.isArray(docs) ? docs : [docs];
    const createdList = items.map((raw) => {
      const data = raw as Omit<StoredRequest, "_id" | "createdAt" | "updatedAt" | "save" | "populate">;
      const id = new Types.ObjectId();
      const now = new Date();
      const doc: StoredRequest = attachRequestMethods({
        ...data,
        _id: id,
        listing: new Types.ObjectId(String(data.listing)),
        owner: new Types.ObjectId(String(data.owner)),
        requester: new Types.ObjectId(String(data.requester)),
        offeredBook: data.offeredBook ? new Types.ObjectId(String(data.offeredBook)) : null,
        createdAt: now,
        updatedAt: now,
        save: async () => doc,
        populate: async () => doc,
      });
      requests.set(String(id), doc);
      return doc;
    });
    return createdList as never;
  });

  mock.method(RequestModel, "findById", (id: unknown) => {
    const found = requests.get(String(id)) ?? null;
    if (found) {
      const chain = {
        session: () => chain,
        populate: () => {
          void found.populate();
          return chain;
        },
        exec: async () => found,
      };
      return chain;
    }
    return makeChain(null);
  });

  mock.method(RequestModel, "countDocuments", (filter: Record<string, unknown>) => {
    const list = [...requests.values()].filter((item) => {
      if (filter.owner && rawIdOf(item.owner) !== String(filter.owner)) return false;
      if (filter.requester && rawIdOf(item.requester) !== String(filter.requester)) return false;
      if (filter.status && item.status !== filter.status) return false;
      return true;
    });
    return makeChain(list.length);
  });

  mock.method(RequestModel, "find", (filter: Record<string, unknown>) => {
    const list = [...requests.values()].filter((item) => {
      if (filter.owner && rawIdOf(item.owner) !== String(filter.owner)) return false;
      if (filter.requester && rawIdOf(item.requester) !== String(filter.requester)) return false;
      if (filter.status && item.status !== filter.status) return false;
      return true;
    });
    const chain = {
      sort: () => chain,
      skip: () => chain,
      limit: () => chain,
      populate: () => {
        for (const item of list) void item.populate();
        return chain;
      },
      exec: async () => list,
    };
    return chain;
  });

  mock.method(
    RequestModel,
    "updateMany",
    (filter: Record<string, unknown>, update: Record<string, unknown>) => {
      const targetListing = String(filter.listing ?? "");
      const excludedId =
        filter._id && typeof filter._id === "object" && "$ne" in filter._id
          ? String((filter._id as { $ne: unknown }).$ne)
          : "";
      const setFields = (update.$set ?? {}) as Record<string, unknown>;

      for (const item of requests.values()) {
        if (
          rawIdOf(item.listing) === targetListing &&
          String(item._id) !== excludedId &&
          item.status === filter.status
        ) {
          if (typeof setFields.status === "string") {
            item.status = setFields.status as StoredRequest["status"];
          }
          if ("rejectionReason" in setFields) {
            item.rejectionReason = setFields.rejectionReason as StoredRequest["rejectionReason"];
          }
          if (typeof setFields["listingSummary.status"] === "string") {
            item.listingSummary.status = setFields["listingSummary.status"] as ListingStatus;
          }
        }
      }
      return makeChain({ acknowledged: true });
    },
  );
});

afterEach(() => mock.restoreAll());

async function call(path: string, init?: RequestInit) {
  const response = await fetch(baseUrl + path, init);
  return { response, body: await response.json() };
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

test("RequestModel and FavoriteModel schemas enforce validation and partial unique indexes", async () => {
  const validFav = new FavoriteModel({
    owner: new Types.ObjectId(requesterId),
    book: sampleBook,
  });
  await validFav.validate();

  const invalidExchangeReq = new RequestModel({
    listing: new Types.ObjectId(listingId),
    owner: new Types.ObjectId(ownerId),
    requester: new Types.ObjectId(requesterId),
    offeredBook: null,
    offeredBookSnapshot: null,
    listingSummary: {
      id: listingId,
      title: "Dune",
      author: "Frank Herbert",
      coverUrl: null,
      modality: "Exchange",
      status: "Available",
    },
    status: "Pending",
    rejectionReason: null,
    quotedModality: "Exchange",
    quotedTerms: { desiredBook: null, priceCop: null, durationDays: null, paymentMethods: null, paymentMethod: null },
  });
  await assert.rejects(
    async () => invalidExchangeReq.validate(),
    (error: mongoose.Error.ValidationError) => Boolean(error.errors.offeredBook),
  );

  const requestIndexes = RequestModel.schema.indexes();
  assert.ok(
    requestIndexes.some(
      ([fields, options]) =>
        fields.listing === 1 &&
        fields.requester === 1 &&
        options.unique === true &&
        Boolean(options.partialFilterExpression),
    ),
  );
});

test("FAVORITE-01..03 create, list, reject duplicate 409, and delete favorites", async () => {
  const memberToken = signToken(requesterId, "Member");
  const adminToken = signToken(adminId, "Admin");

  const forbiddenAdmin = await call("/api/favorites", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(forbiddenAdmin.response.status, 403);

  const created = await call("/api/favorites", {
    method: "POST",
    headers: authHeaders(memberToken),
    body: JSON.stringify({ book: sampleBook }),
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.body.data.book.catalogId, sampleBook.catalogId);

  const duplicate = await call("/api/favorites", {
    method: "POST",
    headers: authHeaders(memberToken),
    body: JSON.stringify({ book: sampleBook }),
  });
  assert.equal(duplicate.response.status, 409);

  const listed = await call("/api/favorites?page=1&limit=10", {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  assert.equal(listed.response.status, 200);
  assert.equal(listed.body.meta.total, 1);
  assert.equal(listed.body.data.length, 1);

  const deleted = await call(`/api/favorites/${created.body.data.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  assert.equal(deleted.response.status, 200);
  assert.deepEqual(deleted.body.data, { id: created.body.data.id, deleted: true });

  const missingAfterDelete = await call(`/api/favorites/${created.body.data.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  assert.equal(missingAfterDelete.response.status, 404);
});

test("REQUEST-01..07 full lifecycle for Loan and competing request rejection", async () => {
  const ownerToken = signToken(ownerId, "Member");
  const requesterToken = signToken(requesterId, "Member");
  const outsiderToken = signToken(outsiderId, "Member");

  const ownListingAttempt = await call(`/api/listings/${listingId}/requests`, {
    method: "POST",
    headers: authHeaders(ownerToken),
    body: "{}",
  });
  assert.equal(ownListingAttempt.response.status, 403);

  const sent1 = await call(`/api/listings/${listingId}/requests`, {
    method: "POST",
    headers: authHeaders(requesterToken),
    body: "{}",
  });
  assert.equal(sent1.response.status, 201);
  assert.equal(sent1.body.data.status, "Pending");

  const duplicateAttempt = await call(`/api/listings/${listingId}/requests`, {
    method: "POST",
    headers: authHeaders(requesterToken),
    body: "{}",
  });
  assert.equal(duplicateAttempt.response.status, 409);

  const sent2 = await call(`/api/listings/${listingId}/requests`, {
    method: "POST",
    headers: authHeaders(outsiderToken),
    body: "{}",
  });
  assert.equal(sent2.response.status, 201);

  const outsiderDetail = await call(`/api/requests/${sent1.body.data.id}`, {
    headers: { Authorization: `Bearer ${outsiderToken}` },
  });
  assert.equal(outsiderDetail.response.status, 404);

  const receivedList = await call("/api/requests?direction=received", {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert.equal(receivedList.response.status, 200);
  assert.equal(receivedList.body.meta.total, 2);

  const accepted = await call(`/api/requests/${sent1.body.data.id}/accept`, {
    method: "PATCH",
    headers: authHeaders(ownerToken),
    body: "{}",
  });
  assert.equal(accepted.response.status, 200);
  assert.equal(accepted.body.data.status, "Accepted");
  assert.equal(listings.get(listingId)?.status, "Reserved");
  assert.equal(copies.get(ownerCopyId)?.status, "Lent");

  const competingAfterAccept = requests.get(sent2.body.data.id);
  assert.equal(competingAfterAccept?.status, "Rejected");
  assert.equal(competingAfterAccept?.rejectionReason, "CompetingRequestAccepted");

  const completed = await call(`/api/requests/${sent1.body.data.id}/complete`, {
    method: "PATCH",
    headers: authHeaders(ownerToken),
    body: "{}",
  });
  assert.equal(completed.response.status, 200);
  assert.equal(completed.body.data.status, "Completed");
  assert.equal(copies.get(ownerCopyId)?.status, "Available");
  assert.equal(listings.get(listingId)?.status, "Closed");
  assert.equal(listings.get(listingId)?.closureReason, "Completed");
});

test("REQUEST-01, 04, 05, 06, 07 handle Exchange offers, reject, cancel and transfer", async () => {
  listings.set(
    listingId,
    makeListing(listingId, "Exchange", {
      desiredBook: offeredBookMeta,
      priceCop: null,
      durationDays: null,
      paymentMethods: null,
    }),
  );

  const ownerToken = signToken(ownerId, "Member");
  const requesterToken = signToken(requesterId, "Member");

  const missingOffer = await call(`/api/listings/${listingId}/requests`, {
    method: "POST",
    headers: authHeaders(requesterToken),
    body: "{}",
  });
  assert.equal(missingOffer.response.status, 400);

  const created = await call(`/api/listings/${listingId}/requests`, {
    method: "POST",
    headers: authHeaders(requesterToken),
    body: JSON.stringify({ offeredBookId: offeredCopyId }),
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.body.data.offeredBookId, offeredCopyId);

  const cancelled = await call(`/api/requests/${created.body.data.id}/cancel`, {
    method: "PATCH",
    headers: authHeaders(requesterToken),
    body: "{}",
  });
  assert.equal(cancelled.response.status, 200);
  assert.equal(cancelled.body.data.status, "Cancelled");

  const created2 = await call(`/api/listings/${listingId}/requests`, {
    method: "POST",
    headers: authHeaders(requesterToken),
    body: JSON.stringify({ offeredBookId: offeredCopyId }),
  });
  assert.equal(created2.response.status, 201);

  const rejected = await call(`/api/requests/${created2.body.data.id}/reject`, {
    method: "PATCH",
    headers: authHeaders(ownerToken),
    body: "{}",
  });
  assert.equal(rejected.response.status, 200);
  assert.equal(rejected.body.data.status, "Rejected");
  assert.equal(rejected.body.data.rejectionReason, "OwnerRejected");

  const created3 = await call(`/api/listings/${listingId}/requests`, {
    method: "POST",
    headers: authHeaders(requesterToken),
    body: JSON.stringify({ offeredBookId: offeredCopyId }),
  });
  assert.equal(created3.response.status, 201);

  const accepted = await call(`/api/requests/${created3.body.data.id}/accept`, {
    method: "PATCH",
    headers: authHeaders(ownerToken),
    body: "{}",
  });
  assert.equal(accepted.response.status, 200);
  assert.equal(copies.get(ownerCopyId)?.status, "Reserved");
  assert.equal(copies.get(offeredCopyId)?.status, "Reserved");

  const completed = await call(`/api/requests/${created3.body.data.id}/complete`, {
    method: "PATCH",
    headers: authHeaders(ownerToken),
    body: "{}",
  });
  assert.equal(completed.response.status, 200);
  assert.equal(copies.get(ownerCopyId)?.status, "Transferred");
  assert.equal(copies.get(offeredCopyId)?.status, "Transferred");
  assert.equal(listings.get(listingId)?.status, "Closed");
});

