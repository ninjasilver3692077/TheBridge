import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, afterEach, before, beforeEach, mock, test } from "node:test";
import { gzipSync } from "node:zlib";
import mongoose from "mongoose";
import { createApp } from "../server/app.js";

let baseUrl = "";
let closeServer: () => void = () => undefined;
let readyState = 0;
let connectShouldFail = false;

before(() => {
  Object.defineProperty(mongoose.connection, "readyState", { get: () => readyState, configurable: true });
  process.env.MONGODB_URI = "mongodb://localhost/test";
  process.env.CLIENT_ORIGINS = "http://localhost:5173";
  const server = createApp().listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  closeServer = () => server.close();
});

after(() => closeServer());

beforeEach(() => {
  readyState = 0;
  connectShouldFail = false;
  mock.method(mongoose, "connect", async () => {
    if (connectShouldFail) throw new Error("unreachable");
    readyState = 1;
    return mongoose;
  });
});

afterEach(() => mock.restoreAll());

async function call(path: string, init?: RequestInit) {
  const response = await fetch(baseUrl + path, init);
  return { response, body: await response.json() };
}

test("health is 200 while storage is connected", async () => {
  const { response, body } = await call("/api/health");
  assert.equal(response.status, 200);
  assert.deepEqual(body, { data: { status: "ok" } });
});

test("health is 503 after the connection drops and cannot be restored", async () => {
  await call("/api/health");
  readyState = 0;
  connectShouldFail = true;
  const { response, body } = await call("/api/health");
  assert.equal(response.status, 503);
  assert.equal(body.code, 503);
});

test("POST /api/health is 405 with an Allow header", async () => {
  const { response, body } = await call("/api/health", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET, HEAD");
  assert.equal(body.code, 405);
});

test("unknown route is 404 JSON even when storage is down", async () => {
  connectShouldFail = true;
  const { response, body } = await call("/api/not-a-route");
  assert.equal(response.status, 404);
  assert.equal(body.code, 404);
});

test("JSON with an unsupported charset is 415", async () => {
  const { response, body } = await call("/api/health", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=iso-8859-1" },
    body: "{}",
  });
  assert.equal(response.status, 415);
  assert.equal(body.code, 415);
});

test("invalid gzip body is 400", async () => {
  const { response, body } = await call("/api/health", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Encoding": "gzip" },
    body: Buffer.from("not gzip"),
  });
  assert.equal(response.status, 400);
  assert.equal(body.code, 400);
});

for (const encoding of ["br", "zstd"]) {
  test(`invalid ${encoding} body is 400`, async () => {
    const { response, body } = await call("/api/health", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Encoding": encoding },
      body: Buffer.from("not compressed"),
    });
    assert.equal(response.status, 400);
    assert.equal(body.code, 400);
  });
}

test("valid gzip body still reaches the route", async () => {
  const { response } = await call("/api/health", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Encoding": "gzip" },
    body: gzipSync("{}"),
  });
  assert.equal(response.status, 405);
});

test("malformed JSON is 400 and oversized body is 413", async () => {
  const headers = { "Content-Type": "application/json" };
  const malformed = await call("/api/health", { method: "POST", headers, body: "{" });
  assert.equal(malformed.response.status, 400);
  const oversized = await call("/api/health", { method: "POST", headers, body: JSON.stringify({ a: "x".repeat(40000) }) });
  assert.equal(oversized.response.status, 413);
});

test("unauthorized Origin is 403", async () => {
  const { response } = await call("/api/health", { headers: { Origin: "http://evil.example" } });
  assert.equal(response.status, 403);
});
