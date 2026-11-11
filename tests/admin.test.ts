import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, afterEach, before, beforeEach, mock, test } from "node:test";
import jwt from "jsonwebtoken";
import mongoose, { Types } from "mongoose";
import { AccountModel } from "../models/Account.js";
import { createApp } from "../server/app.js";

const jwtSecret = "test-jwt-secret-with-at-least-32-bytes!!";
const adminId = new Types.ObjectId();
const memberId = new Types.ObjectId();
const createdAt = new Date("2026-11-01T12:00:00.000Z");

let baseUrl = "";
let closeServer: () => void = () => undefined;
let lastMemberFilter: Record<string, unknown> = {};

function chain<T>(value: T) {
  const query = {
    select: () => query,
    sort: () => query,
    skip: () => query,
    limit: () => query,
    exec: async () => value,
  };
  return query;
}

function tokenFor(id: Types.ObjectId) {
  return jwt.sign({}, jwtSecret, { algorithm: "HS256", subject: String(id), expiresIn: 60 });
}

async function call(path: string, token?: string) {
  const response = await fetch(baseUrl + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { response, body: await response.json() };
}

before(() => {
  Object.defineProperty(mongoose.connection, "readyState", { get: () => 1, configurable: true });
  process.env.MONGODB_URI = "mongodb://localhost/test";
  process.env.CLIENT_ORIGINS = "http://localhost:5173";
  process.env.JWT_SECRET = jwtSecret;
  const server = createApp().listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  closeServer = () => server.close();
});

after(() => closeServer());

beforeEach(() => {
  mock.method(AccountModel, "findById", (id: unknown) =>
    chain(String(id) === String(adminId) ? { _id: adminId, name: "Admin", role: "Admin" } : { _id: memberId, name: "Laura", role: "Member" }),
  );
  mock.method(AccountModel, "countDocuments", (filter: Record<string, unknown>) => {
    lastMemberFilter = filter;
    return chain(1);
  });
  mock.method(AccountModel, "find", () =>
    chain([{ _id: memberId, name: "Laura", email: "laura@example.edu", createdAt }]),
  );
});

afterEach(() => mock.restoreAll());

test("admin endpoints reject anonymous callers with 401 and Members with 403", async () => {
  for (const path of ["/api/admin/listings", "/api/admin/members"]) {
    assert.equal((await call(path)).response.status, 401);
    assert.equal((await call(path, tokenFor(memberId))).response.status, 403);
  }
});

test("ADMIN-04 lists only Members as MemberSummary with pagination meta", async () => {
  const { response, body } = await call("/api/admin/members?limit=5", tokenFor(adminId));
  assert.equal(response.status, 200);
  assert.equal(lastMemberFilter.role, "Member");
  assert.deepEqual(body, {
    data: [{ id: String(memberId), name: "Laura", email: "laura@example.edu", createdAt: createdAt.toISOString() }],
    meta: { page: 1, limit: 5, total: 1, totalPages: 1 },
  });
});

test("ADMIN-02 rejects an unknown status and unknown query parameters with 400", async () => {
  assert.equal((await call("/api/admin/listings?status=Bogus", tokenFor(adminId))).response.status, 400);
  assert.equal((await call("/api/admin/listings?foo=1", tokenFor(adminId))).response.status, 400);
});
