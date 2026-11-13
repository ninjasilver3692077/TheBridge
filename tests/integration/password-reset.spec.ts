import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, afterEach, before, beforeEach, mock, test } from "node:test";
import bcrypt from "bcryptjs";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import mongoose from "mongoose";
import { AccountModel } from "../../models/Account.js";
import { createApp } from "../../server/app.js";
import { hashResetToken, passwordResetMessage } from "../../server/passwordReset.js";
import { resetMail } from "../../server/resetMail.js";
import type { PasswordResetEmail } from "../../server/resetMail.js";

let replSet: MongoMemoryReplSet;
let baseUrl = "";
let closeServer = () => {};
let sent: PasswordResetEmail[] = [];
const oldPassword = "old-correct-password";
const newPassword = "new-correct-password";
let existingHash = "";

async function call(path: string, body?: unknown, method = "POST") {
  const response = await fetch(baseUrl + "/api/auth/" + path, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { response, status: response.status, body: await response.json() };
}

async function forgot(email = "member@example.edu") {
  return call("forgot-password", { email });
}

async function reset(token: string, password = newPassword) {
  return call("reset-password", { token, newPassword: password });
}

before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = replSet.getUri();
  process.env.JWT_SECRET = "password-reset-integration-secret-at-least-32-bytes";
  process.env.JWT_TTL_SECONDS = "86400";
  await mongoose.connect(replSet.getUri());
  await AccountModel.syncIndexes();
  existingHash = await bcrypt.hash(oldPassword, 4);
});

beforeEach(async () => {
  await AccountModel.deleteMany({});
  await AccountModel.create({ name: "Member", email: "member@example.edu", passwordHash: existingHash, role: "Member" });
  const server = createApp().listen(0);
  baseUrl = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
  closeServer = () => server.close();
  sent = [];
  mock.method(resetMail, "send", async (message: PasswordResetEmail) => { sent.push(message); });
});

afterEach(() => { closeServer(); mock.restoreAll(); });
after(async () => { await mongoose.disconnect(); await replSet?.stop(); });

test("forgot-password returns identical 200 data and headers for known and unknown emails, storing only a hidden hash", async () => {
  const known = await forgot(" MEMBER@EXAMPLE.EDU ");
  const unknown = await forgot("unknown@example.edu");
  assert.equal(known.status, 200);
  assert.equal(unknown.status, 200);
  assert.deepEqual(known.body, unknown.body);
  assert.deepEqual(known.body, { data: { message: passwordResetMessage } });
  assert.equal(known.response.headers.get("cache-control"), "no-store");
  assert.equal(unknown.response.headers.get("cache-control"), "no-store");
  assert.equal(sent.length, 1);
  const account = await AccountModel.findOne({ email: "member@example.edu" }).select("+passwordHash +passwordResetHash +passwordResetExpiresAt").lean();
  assert.equal(account?.passwordResetHash, hashResetToken(sent[0]!.token));
  assert.notEqual(account?.passwordResetHash, sent[0]!.token);
  assert.ok(account?.passwordResetExpiresAt && Math.abs(account.passwordResetExpiresAt.getTime() - Date.now() - 3600000) < 5000);
  assert.equal(account?.passwordHash, existingHash);
  const publicProjection = await AccountModel.findOne({ email: "member@example.edu" }).lean();
  assert.equal(publicProjection?.passwordResetHash, undefined);
  assert.equal(publicProjection?.passwordResetExpiresAt, undefined);
  assert.equal(JSON.stringify(known.body).includes(sent[0]!.token), false);
});

test("reset changes the bcrypt password atomically, consumes the token and makes the old login fail", async () => {
  await forgot();
  const token = sent[0]!.token;
  const changed = await reset(token);
  assert.equal(changed.status, 200);
  assert.equal(changed.response.headers.get("cache-control"), "no-store");
  const account = await AccountModel.findOne().select("+passwordHash +passwordResetHash +passwordResetExpiresAt").lean();
  assert.ok(account && await bcrypt.compare(newPassword, account.passwordHash));
  assert.equal(bcrypt.getRounds(account!.passwordHash), 12);
  assert.equal(account?.passwordResetHash, undefined);
  assert.equal(account?.passwordResetExpiresAt, undefined);
  assert.equal((await reset(token)).status, 400);
  assert.equal((await call("login", { email: "member@example.edu", password: oldPassword })).status, 401);
  const login = await call("login", { email: "member@example.edu", password: newPassword });
  assert.equal(login.status, 200);
  assert.equal(JSON.stringify(login.body).includes("passwordReset"), false);
});

test("expired, malformed and unknown tokens fail without changing the password", async () => {
  await forgot();
  await AccountModel.updateOne({ email: "member@example.edu" }, { $set: { passwordResetExpiresAt: new Date(Date.now() - 1) } });
  for (const token of [sent[0]!.token, "f".repeat(64), "bad"]) assert.equal((await reset(token)).status, 400);
  assert.equal((await AccountModel.findOne().select("+passwordHash"))?.passwordHash, existingHash);
});

test("a newer request invalidates the old link and invalid password input leaves the current link usable", async () => {
  await forgot();
  await forgot();
  assert.equal((await reset(sent[0]!.token)).status, 400);
  assert.equal((await reset(sent[1]!.token, "short")).status, 400);
  assert.equal((await reset(sent[1]!.token, "é".repeat(37))).status, 400);
  assert.equal((await reset(sent[1]!.token)).status, 200);
});

test("two simultaneous uses of the same link have exactly one winner", async () => {
  await forgot();
  const responses = await Promise.all([reset(sent[0]!.token, "first-candidate-password"), reset(sent[0]!.token, "second-candidate-password")]);
  assert.deepEqual(responses.map(result => result.status).sort(), [200, 400]);
  const stored = await AccountModel.findOne().select("+passwordHash");
  const winningPassword = responses[0]!.status === 200 ? "first-candidate-password" : "second-candidate-password";
  assert.ok(stored && await bcrypt.compare(winningPassword, stored.passwordHash));
});

test("delivery failure preserves the generic response and clears only its own token", async () => {
  mock.method(resetMail, "send", async () => { throw new Error("private provider details"); });
  const logs = mock.method(console, "error", () => {});
  const result = await forgot();
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { data: { message: passwordResetMessage } });
  assert.equal((await AccountModel.findOne().select("+passwordResetHash"))?.passwordResetHash, undefined);
  assert.deepEqual(logs.mock.calls[0]?.arguments, ["Password reset email delivery failed."]);
});

test("a delayed delivery failure cannot clear a newer successful reset link", async () => {
  let releaseFailure = () => {};
  let firstEntered = () => {};
  const entered = new Promise<void>(resolve => { firstEntered = resolve; });
  const failed = new Promise<void>(resolve => { releaseFailure = resolve; });
  let deliveries = 0;
  mock.method(console, "error", () => {});
  mock.method(resetMail, "send", async (message: PasswordResetEmail) => {
    sent.push(message);
    deliveries += 1;
    if (deliveries === 1) { firstEntered(); await failed; throw new Error("delivery failed"); }
  });
  const first = forgot();
  await entered;
  assert.equal((await forgot()).status, 200);
  releaseFailure();
  assert.equal((await first).status, 200);
  assert.equal((await reset(sent[1]!.token)).status, 200);
});

test("recovery supports Admin accounts and a deleted account cannot use a previously issued link", async () => {
  await AccountModel.updateOne({ email: "member@example.edu" }, { $set: { role: "Admin" } });
  await forgot();
  assert.equal((await reset(sent[0]!.token)).status, 200);
  await forgot();
  await AccountModel.deleteOne({ email: "member@example.edu" });
  assert.equal((await reset(sent[1]!.token)).status, 400);
});

test("recovery validates payloads, rejects unsupported methods and rate limits both endpoints independently", async () => {
  assert.equal((await call("forgot-password", { email: { $ne: "" } })).status, 400);
  assert.equal((await call("forgot-password", { email: "member@example.edu", role: "Admin" })).status, 400);
  const wrongMethod = await call("reset-password", undefined, "GET");
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.response.headers.get("allow"), "POST");
  for (let attempt = 0; attempt < 8; attempt += 1) assert.equal((await forgot("unknown@example.edu")).status, 200);
  const limited = await forgot();
  assert.equal(limited.status, 429);
  assert.ok(limited.response.headers.get("retry-after"));
  for (let attempt = 0; attempt < 9; attempt += 1) assert.equal((await reset("bad")).status, 400);
  assert.equal((await reset("bad")).status, 429);
});
