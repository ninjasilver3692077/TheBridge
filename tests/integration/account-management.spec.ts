import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import mongoose from "mongoose";
import type { BookMetadata, ListingTerms, Modality } from "@/types";
import { AccountModel } from "../../models/Account.js";
import { FavoriteModel } from "../../models/Favorite.js";
import { LibraryBookModel } from "../../models/LibraryBook.js";
import { ListingModel } from "../../models/Listing.js";
import { RequestModel } from "../../models/Request.js";
import { createSession, hashPassword } from "../../server/accounts.js";
import { createApp } from "../../server/app.js";

const jwtSecret = "integration-jwt-secret-with-32-bytes!!";
const initialPassword = "correct-horse-battery";

const sampleBook: BookMetadata = {
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

const secondBook: BookMetadata = {
  catalogId: "/works/OL1168083W",
  title: "1984",
  author: "George Orwell",
  genre: "Dystopian",
  coverUrl: null,
  year: 1949,
  publisher: null,
  isbn: null,
  language: "eng",
};

const termsByModality: Record<Modality, ListingTerms> = {
  Sale: { desiredBook: null, priceCop: 45000, durationDays: null },
  Exchange: { desiredBook: null, priceCop: null, durationDays: null },
  Loan: { desiredBook: null, priceCop: null, durationDays: 14 },
  Rental: { desiredBook: null, priceCop: 12000, durationDays: 7 },
};

let replSet: MongoMemoryReplSet;
let baseUrl = "";
let closeServer: () => void = () => undefined;
let sharedPasswordHash = "";

async function createAccountWithToken(
  name: string,
  email: string,
  role: "Member" | "Admin" = "Member",
) {
  const doc = await AccountModel.create({
    name,
    email,
    passwordHash: sharedPasswordHash,
    role,
  });
  const session = createSession(doc.toObject());
  return { id: String(doc._id), token: session.token, email: doc.email };
}

async function apiCall(
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {},
) {
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = replSet.getUri();
  process.env.CLIENT_ORIGINS = "http://localhost:5173";
  process.env.JWT_SECRET = jwtSecret;
  process.env.JWT_TTL_SECONDS = "86400";
  sharedPasswordHash = await hashPassword(initialPassword);
  await mongoose.connect(replSet.getUri());
  await Promise.all([
    AccountModel.syncIndexes(),
    LibraryBookModel.syncIndexes(),
    ListingModel.syncIndexes(),
    RequestModel.syncIndexes(),
    FavoriteModel.syncIndexes(),
  ]);
  const server = createApp().listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  closeServer = () => server.close();
});

beforeEach(async () => {
  await Promise.all([
    AccountModel.deleteMany({}),
    LibraryBookModel.deleteMany({}),
    ListingModel.deleteMany({}),
    RequestModel.deleteMany({}),
    FavoriteModel.deleteMany({}),
  ]);
});

after(async () => {
  closeServer();
  await mongoose.disconnect();
  await replSet.stop();
});

test("PATCH /api/account/password updates Member and Admin passwords and returns 401 on wrong currentPassword", async () => {
  const member = await createAccountWithToken("Laura Gomez", "laura@example.edu", "Member");
  const admin = await createAccountWithToken("Admin User", "admin@example.edu", "Admin");

  const anonymousAttempt = await apiCall("/api/account/password", {
    method: "PATCH",
    body: { currentPassword: initialPassword, newPassword: "new-password-123" },
  });
  assert.equal(anonymousAttempt.status, 401);

  const wrongCurrent = await apiCall("/api/account/password", {
    method: "PATCH",
    token: member.token,
    body: { currentPassword: "wrong-password", newPassword: "new-password-123" },
  });
  assert.equal(wrongCurrent.status, 401);
  assert.equal(wrongCurrent.body.error, "Current password is incorrect.");

  const stillOldLogin = await apiCall("/api/auth/login", {
    method: "POST",
    body: { email: member.email, password: initialPassword },
  });
  assert.equal(stillOldLogin.status, 200);

  const invalidNewPassword = await apiCall("/api/account/password", {
    method: "PATCH",
    token: member.token,
    body: { currentPassword: initialPassword, newPassword: "short" },
  });
  assert.equal(invalidNewPassword.status, 400);
  assert.equal(invalidNewPassword.body.error, "newPassword: use at least 8 characters.");

  const memberUpdated = await apiCall("/api/account/password", {
    method: "PATCH",
    token: member.token,
    body: { currentPassword: initialPassword, newPassword: "member-new-password" },
  });
  assert.equal(memberUpdated.status, 200);

  const oldLoginRejected = await apiCall("/api/auth/login", {
    method: "POST",
    body: { email: member.email, password: initialPassword },
  });
  assert.equal(oldLoginRejected.status, 401);

  const newLoginAccepted = await apiCall("/api/auth/login", {
    method: "POST",
    body: { email: member.email, password: "member-new-password" },
  });
  assert.equal(newLoginAccepted.status, 200);

  const adminUpdated = await apiCall("/api/account/password", {
    method: "PATCH",
    token: admin.token,
    body: { currentPassword: initialPassword, newPassword: "admin-new-password" },
  });
  assert.equal(adminUpdated.status, 200);

  const adminNewLogin = await apiCall("/api/auth/login", {
    method: "POST",
    body: { email: admin.email, password: "admin-new-password" },
  });
  assert.equal(adminNewLogin.status, 200);
});

test("DELETE /api/admin/accounts/:id enforces 403 on Admin or own account and 404 on unknown account", async () => {
  const adminOne = await createAccountWithToken("Admin One", "admin1@example.edu", "Admin");
  const adminTwo = await createAccountWithToken("Admin Two", "admin2@example.edu", "Admin");
  const member = await createAccountWithToken("Laura Gomez", "laura@example.edu", "Member");

  const anonymousAttempt = await apiCall(`/api/admin/accounts/${member.id}`, {
    method: "DELETE",
  });
  assert.equal(anonymousAttempt.status, 401);

  const memberAttempt = await apiCall(`/api/admin/accounts/${member.id}`, {
    method: "DELETE",
    token: member.token,
  });
  assert.equal(memberAttempt.status, 403);

  const selfAdminAttempt = await apiCall(`/api/admin/accounts/${adminOne.id}`, {
    method: "DELETE",
    token: adminOne.token,
  });
  assert.equal(selfAdminAttempt.status, 403);

  const otherAdminAttempt = await apiCall(`/api/admin/accounts/${adminTwo.id}`, {
    method: "DELETE",
    token: adminOne.token,
  });
  assert.equal(otherAdminAttempt.status, 403);

  const adminSelfEndpointAttempt = await apiCall("/api/account", {
    method: "DELETE",
    token: adminOne.token,
    body: { password: initialPassword },
  });
  assert.equal(adminSelfEndpointAttempt.status, 403);

  const unknownId = new mongoose.Types.ObjectId().toString();
  const notFoundAttempt = await apiCall(`/api/admin/accounts/${unknownId}`, {
    method: "DELETE",
    token: adminOne.token,
  });
  assert.equal(notFoundAttempt.status, 404);

  assert.equal(await AccountModel.countDocuments({}), 3);
});

test("DELETE /api/account and DELETE /api/admin/accounts/:id return 409 for Accepted Loan, Rental, Sale and Exchange until completed", async () => {
  const admin = await createAccountWithToken("Admin Root", "admin@example.edu", "Admin");

  for (const modality of ["Loan", "Rental", "Sale", "Exchange"] as const) {
    const owner = await createAccountWithToken(
      `Owner ${modality}`,
      `owner-${modality.toLowerCase()}@example.edu`,
      "Member",
    );
    const requester = await createAccountWithToken(
      `Requester ${modality}`,
      `requester-${modality.toLowerCase()}@example.edu`,
      "Member",
    );

    const ownerCopy = await LibraryBookModel.create({
      owner: owner.id,
      book: sampleBook,
      condition: "Good condition",
      notes: "",
      status: "Available",
    });

    const listingRes = await apiCall("/api/listings", {
      method: "POST",
      token: owner.token,
      body: {
        libraryBookId: String(ownerCopy._id),
        modality,
        terms: termsByModality[modality],
      },
    });
    assert.equal(listingRes.status, 201);
    const listingId = (listingRes.body.data as { id: string }).id;

    let offeredBookId: string | undefined;
    if (modality === "Exchange") {
      const offeredCopy = await LibraryBookModel.create({
        owner: requester.id,
        book: secondBook,
        condition: "Like new",
        notes: "",
        status: "Available",
      });
      offeredBookId = String(offeredCopy._id);
    }

    const requestRes = await apiCall(`/api/listings/${listingId}/requests`, {
      method: "POST",
      token: requester.token,
      body: offeredBookId ? { offeredBookId } : {},
    });
    assert.equal(requestRes.status, 201);
    const requestId = (requestRes.body.data as { id: string }).id;

    const acceptRes = await apiCall(`/api/requests/${requestId}/accept`, {
      method: "PATCH",
      token: owner.token,
      body: {},
    });
    assert.equal(acceptRes.status, 200);

    const ownerSelfDeleteBlocked = await apiCall("/api/account", {
      method: "DELETE",
      token: owner.token,
      body: { password: initialPassword },
    });
    assert.equal(ownerSelfDeleteBlocked.status, 409);

    const requesterSelfDeleteBlocked = await apiCall("/api/account", {
      method: "DELETE",
      token: requester.token,
      body: { password: initialPassword },
    });
    assert.equal(requesterSelfDeleteBlocked.status, 409);

    const adminDeleteOwnerBlocked = await apiCall(`/api/admin/accounts/${owner.id}`, {
      method: "DELETE",
      token: admin.token,
    });
    assert.equal(adminDeleteOwnerBlocked.status, 409);

    const adminDeleteRequesterBlocked = await apiCall(
      `/api/admin/accounts/${requester.id}`,
      {
        method: "DELETE",
        token: admin.token,
      },
    );
    assert.equal(adminDeleteRequesterBlocked.status, 409);

    assert.notEqual(await AccountModel.findById(owner.id), null);
    assert.notEqual(await AccountModel.findById(requester.id), null);
    assert.equal((await RequestModel.findById(requestId))?.status, "Accepted");

    const completeRes = await apiCall(`/api/requests/${requestId}/complete`, {
      method: "PATCH",
      token: owner.token,
      body: {},
    });
    assert.equal(completeRes.status, 200);

    const deleteOwnerAfterComplete = await apiCall("/api/account", {
      method: "DELETE",
      token: owner.token,
      body: { password: initialPassword },
    });
    assert.equal(deleteOwnerAfterComplete.status, 200);
    assert.equal(await AccountModel.findById(owner.id), null);

    const deleteRequesterAfterComplete = await apiCall(
      `/api/admin/accounts/${requester.id}`,
      {
        method: "DELETE",
        token: admin.token,
      },
    );
    assert.equal(deleteRequesterAfterComplete.status, 200);
    assert.equal(await AccountModel.findById(requester.id), null);
  }
});

test("deleting a Member account atomically removes books, listings and favorites and rejects Pending requests with AccountDeleted", async () => {
  const admin = await createAccountWithToken("Admin Root", "admin@example.edu", "Admin");
  const laura = await createAccountWithToken("Laura Gomez", "laura@example.edu", "Member");
  const andres = await createAccountWithToken("Andres Perez", "andres@example.edu", "Member");

  await FavoriteModel.create({ owner: laura.id, book: sampleBook });

  const lauraCopy = await LibraryBookModel.create({
    owner: laura.id,
    book: sampleBook,
    condition: "Good condition",
    notes: "Clean pages",
    status: "Available",
  });
  const lauraListingRes = await apiCall("/api/listings", {
    method: "POST",
    token: laura.token,
    body: {
      libraryBookId: String(lauraCopy._id),
      modality: "Exchange",
      terms: termsByModality.Exchange,
    },
  });
  assert.equal(lauraListingRes.status, 201);
  const lauraListingId = (lauraListingRes.body.data as { id: string }).id;

  const andresOfferedCopy = await LibraryBookModel.create({
    owner: andres.id,
    book: secondBook,
    condition: "Like new",
    notes: "",
    status: "Available",
  });

  const incomingReqRes = await apiCall(`/api/listings/${lauraListingId}/requests`, {
    method: "POST",
    token: andres.token,
    body: { offeredBookId: String(andresOfferedCopy._id) },
  });
  assert.equal(incomingReqRes.status, 201);
  const incomingReqId = (incomingReqRes.body.data as { id: string }).id;

  const andresListingCopy = await LibraryBookModel.create({
    owner: andres.id,
    book: sampleBook,
    condition: "Used copy",
    notes: "",
    status: "Available",
  });
  const andresListingRes = await apiCall("/api/listings", {
    method: "POST",
    token: andres.token,
    body: {
      libraryBookId: String(andresListingCopy._id),
      modality: "Loan",
      terms: termsByModality.Loan,
    },
  });
  assert.equal(andresListingRes.status, 201);
  const andresListingId = (andresListingRes.body.data as { id: string }).id;

  const outgoingReqRes = await apiCall(`/api/listings/${andresListingId}/requests`, {
    method: "POST",
    token: laura.token,
    body: {},
  });
  assert.equal(outgoingReqRes.status, 201);
  const outgoingReqId = (outgoingReqRes.body.data as { id: string }).id;

  const wrongPasswordDelete = await apiCall("/api/account", {
    method: "DELETE",
    token: laura.token,
    body: { password: "wrong-password" },
  });
  assert.equal(wrongPasswordDelete.status, 401);
  assert.notEqual(await AccountModel.findById(laura.id), null);

  const deleteRes = await apiCall("/api/account", {
    method: "DELETE",
    token: laura.token,
    body: { password: initialPassword },
  });
  assert.equal(deleteRes.status, 200);
  assert.deepEqual(deleteRes.body, { data: { id: laura.id, deleted: true } });

  assert.equal(await AccountModel.findById(laura.id), null);
  assert.equal(await LibraryBookModel.countDocuments({ owner: laura.id }), 0);
  assert.equal(await ListingModel.countDocuments({ owner: laura.id }), 0);
  assert.equal(await FavoriteModel.countDocuments({ owner: laura.id }), 0);

  const expiredSessionCheck = await apiCall("/api/auth/me", { token: laura.token });
  assert.equal(expiredSessionCheck.status, 401);

  const incomingRequest = await RequestModel.findById(incomingReqId);
  assert.equal(incomingRequest?.status, "Rejected");
  assert.equal(incomingRequest?.rejectionReason, "AccountDeleted");

  const outgoingRequest = await RequestModel.findById(outgoingReqId);
  assert.equal(outgoingRequest?.status, "Rejected");
  assert.equal(outgoingRequest?.rejectionReason, "AccountDeleted");

  const andresSentRes = await apiCall("/api/requests?direction=sent", {
    token: andres.token,
  });
  assert.equal(andresSentRes.status, 200);
  const sentData = andresSentRes.body.data as {
    id: string;
    status: string;
    rejectionReason: string;
    owner: { id: string };
  }[];
  assert.equal(sentData.length, 1);
  assert.equal(sentData[0]?.id, incomingReqId);
  assert.equal(sentData[0]?.status, "Rejected");
  assert.equal(sentData[0]?.rejectionReason, "AccountDeleted");
  assert.equal(sentData[0]?.owner.id, laura.id);

  const andresReceivedRes = await apiCall("/api/requests?direction=received", {
    token: andres.token,
  });
  assert.equal(andresReceivedRes.status, 200);
  const receivedData = andresReceivedRes.body.data as {
    id: string;
    status: string;
    rejectionReason: string;
    requester: { id: string };
  }[];
  assert.equal(receivedData.length, 1);
  assert.equal(receivedData[0]?.id, outgoingReqId);
  assert.equal(receivedData[0]?.status, "Rejected");
  assert.equal(receivedData[0]?.rejectionReason, "AccountDeleted");
  assert.equal(receivedData[0]?.requester.id, laura.id);

  const editFreedOffer = await apiCall(`/api/my-books/${String(andresOfferedCopy._id)}`, {
    method: "PATCH",
    token: andres.token,
    body: { notes: "Offer is free again after counterpart deletion" },
  });
  assert.equal(editFreedOffer.status, 200);

  const adminRequestsRes = await apiCall("/api/admin/requests?status=Rejected", {
    token: admin.token,
  });
  assert.equal(adminRequestsRes.status, 200);
  assert.equal((adminRequestsRes.body.meta as { total: number }).total, 2);
});
