import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, afterEach, before, beforeEach, mock, test } from "node:test";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose, { Types } from "mongoose";
import { AccountModel } from "../models/Account.js";
import type { StoredAccount } from "../server/accounts.js";
import { createApp } from "../server/app.js";

const jwtSecret = "test-jwt-secret-with-at-least-32-bytes!!";
const existingPassword = "correct-horse-battery";

let baseUrl = "";
let closeServer: () => void = () => undefined;
let accounts: Map<string, StoredAccount>;
let existingHash = "";

function chain<T>(value: T) {
  const query = {
    select: () => query,
    lean: () => query,
    exec: async () => value,
    then: (resolve: (result: T) => unknown, reject: (error: unknown) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
  };
  return query;
}

function findByEmail(email: unknown): StoredAccount | null {
  return [...accounts.values()].find((account) => account.email === email) ?? null;
}

function withoutHash(account: StoredAccount | null) {
  if (!account) return null;
  return Object.fromEntries(Object.entries(account).filter(([field]) => field !== "passwordHash"));
}

async function call(path: string, init: { method?: string; body?: unknown; token?: string } = {}) {
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.token) headers.Authorization = `Bearer ${init.token}`;
  const response = await fetch(baseUrl + path, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  return { response, body: await response.json() };
}

before(async () => {
  Object.defineProperty(mongoose.connection, "readyState", { get: () => 1, configurable: true });
  process.env.MONGODB_URI = "mongodb://localhost/test";
  process.env.CLIENT_ORIGINS = "http://localhost:5173";
  process.env.JWT_SECRET = jwtSecret;
  process.env.JWT_TTL_SECONDS = "86400";
  existingHash = await bcrypt.hash(existingPassword, 4);
});

after(() => closeServer());

beforeEach(() => {
  closeServer();
  const server = createApp().listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  closeServer = () => server.close();
  const now = new Date("2026-11-01T12:00:00.000Z");
  const existingId = new Types.ObjectId();
  accounts = new Map([
    [
      String(existingId),
      {
        _id: existingId,
        name: "Laura Gomez",
        email: "laura@example.edu",
        passwordHash: existingHash,
        role: "Member",
        createdAt: now,
        updatedAt: now,
      },
    ],
  ]);

  mock.method(AccountModel, "exists", (filter: { email: string }) =>
    chain(findByEmail(filter.email) ? { _id: new Types.ObjectId() } : null),
  );
  mock.method(AccountModel, "findOne", (filter: { email: string }) => chain(findByEmail(filter.email)));
  mock.method(AccountModel, "findById", (id: unknown) => chain(withoutHash(accounts.get(String(id)) ?? null)));
  mock.method(AccountModel, "create", async (input: Omit<StoredAccount, "_id" | "createdAt" | "updatedAt">) => {
    const created: StoredAccount = { ...input, _id: new Types.ObjectId(), createdAt: now, updatedAt: now };
    accounts.set(String(created._id), created);
    return { toObject: () => created };
  });
});

afterEach(() => mock.restoreAll());

test("AUTH-01 registers a Member and returns a session without the password hash", async () => {
  const { response, body } = await call("/api/auth/register", {
    method: "POST",
    body: { name: "  Daniel  ", email: "Daniel@Example.EDU ", password: "long-enough-pass" },
  });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(body.data.account.role, "Member");
  assert.equal(body.data.account.name, "Daniel");
  assert.equal(body.data.account.email, "daniel@example.edu");
  assert.equal(JSON.stringify(body).includes("passwordHash"), false);
  const claims = jwt.verify(body.data.token, jwtSecret, { algorithms: ["HS256"] }) as jwt.JwtPayload;
  assert.equal(claims.sub, body.data.account.id);
  assert.equal((claims.exp ?? 0) - (claims.iat ?? 0), 86400);
  assert.equal(body.data.expiresAt, new Date((claims.exp ?? 0) * 1000).toISOString());
  const stored = accounts.get(body.data.account.id);
  assert.ok(stored && (await bcrypt.compare("long-enough-pass", stored.passwordHash)));
  assert.equal(bcrypt.getRounds(stored.passwordHash), 12);
});

test("AUTH-01 returns 409 for a duplicate normalized email", async () => {
  const { response, body } = await call("/api/auth/register", {
    method: "POST",
    body: { name: "Laura", email: "LAURA@example.edu", password: "long-enough-pass" },
  });
  assert.equal(response.status, 409);
  assert.deepEqual(body, { error: "An account with this email already exists.", code: 409 });
});

test("AUTH-01 returns 400 with the failing field", async () => {
  const cases: [Record<string, unknown>, string][] = [
    [{ email: "a@b.co", password: "long-enough-pass" }, "name: enter your name."],
    [{ name: "A", email: "not-an-email", password: "long-enough-pass" }, "email: enter a valid email address."],
    [{ name: "A", email: "a@b.co", password: "short" }, "password: use at least 8 characters."],
    [{ name: "A", email: "a@b.co", password: "x".repeat(73) }, "password: use at most 72 bytes."],
  ];
  for (const [input, message] of cases) {
    const { response, body } = await call("/api/auth/register", { method: "POST", body: input });
    assert.equal(response.status, 400);
    assert.deepEqual(body, { error: message, code: 400 });
  }
});

test("AUTH-01 refuses privileged fields such as role", async () => {
  const { response, body } = await call("/api/auth/register", {
    method: "POST",
    body: { name: "A", email: "a@b.co", password: "long-enough-pass", role: "Admin" },
  });
  assert.equal(response.status, 400);
  assert.deepEqual(body, { error: "role: field is not allowed.", code: 400 });
});

test("AUTH-02 logs in with valid credentials", async () => {
  const { response, body } = await call("/api/auth/login", {
    method: "POST",
    body: { email: " Laura@Example.edu", password: existingPassword },
  });
  assert.equal(response.status, 200);
  assert.equal(body.data.account.email, "laura@example.edu");
  assert.equal(typeof body.data.token, "string");
});

test("AUTH-02 returns one generic 401 for a wrong password and an unknown email", async () => {
  const wrongPassword = await call("/api/auth/login", {
    method: "POST",
    body: { email: "laura@example.edu", password: "wrong-password" },
  });
  const unknownEmail = await call("/api/auth/login", {
    method: "POST",
    body: { email: "nobody@example.edu", password: existingPassword },
  });
  assert.equal(wrongPassword.response.status, 401);
  assert.equal(unknownEmail.response.status, 401);
  assert.deepEqual(wrongPassword.body, unknownEmail.body);
  assert.deepEqual(wrongPassword.body, { error: "Email or password is incorrect.", code: 401 });
});

test("AUTH-03 returns the authenticated account", async () => {
  const login = await call("/api/auth/login", {
    method: "POST",
    body: { email: "laura@example.edu", password: existingPassword },
  });
  const { response, body } = await call("/api/auth/me", { token: login.body.data.token });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(body.data, login.body.data.account);
});

test("AUTH-03 returns 401 for missing, invalid and expired tokens", async () => {
  const [id] = accounts.keys();
  const expired = jwt.sign({ role: "Member" }, jwtSecret, { algorithm: "HS256", subject: id, expiresIn: -10 });
  for (const token of [undefined, "not-a-jwt", expired]) {
    const { response, body } = await call("/api/auth/me", { token });
    assert.equal(response.status, 401);
    assert.equal(body.code, 401);
  }
});

test("auth routes answer unsupported methods with 405", async () => {
  const { response } = await call("/api/auth/login");
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "POST");
});
