import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { createApp } from "../server/app.js";
import { searchOpenLibraryWithCache } from "../src/services/openLibrary.js";

const art = { key: "/works/OL1W", title: "Art" };
const dune = { key: "/works/OL2W", title: "Dune", author_name: ["Frank Herbert"] };

test("catalog API uses a fixed upstream and reports failure separately from no matches", async (t) => {
  const localFetch = globalThis.fetch;
  const upstream = t.mock.method(globalThis, "fetch", async (url: URL, init: RequestInit) => {
    assert.equal(url.origin + url.pathname, "https://openlibrary.org/search.json");
    assert.equal(url.searchParams.get("limit"), "20");
    assert.equal(init.redirect, "error");
    assert.ok(init.signal);
    switch (url.searchParams.get("q")) {
      case "art":
        return new Response("upstream error", { status: 502 });
      case "Dune":
        return Response.json({ docs: [dune] });
      case "invalid":
        return Response.json({ docs: null });
      default:
        return Response.json({ docs: [] });
    }
  });

  const server = createApp().listen(0);
  t.after(() => { server.close(); });
  const endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/catalog/search`;

  for (const params of ["", "?q=ab", "?q=art&q=Dune", "?q=art&limit=100", `?q=${"a".repeat(101)}`]) {
    const response = await localFetch(endpoint + params);
    assert.equal(response.status, 400);
  }
  assert.equal(upstream.mock.callCount(), 0);

  for (const query of ["art", "invalid"]) {
    const response = await localFetch(`${endpoint}?q=${query}`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: "Open Library is unavailable. Try again later.",
      code: 503,
    });
  }

  const results = await localFetch(`${endpoint}?q=%20Dune%20`);
  assert.equal(results.status, 200);
  assert.deepEqual(await results.json(), { data: { docs: [dune] } });

  const empty = await localFetch(`${endpoint}?q=no+matches`);
  assert.equal(empty.status, 200);
  assert.deepEqual(await empty.json(), { data: { docs: [] } });
});

test("catalog service can retry with an empty cache and use only same-query saved data", async (t) => {
  const storage = new Map<string, string>();
  const cacheStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  };
  const browser = { onLine: true };
  for (const [name, value] of Object.entries({ localStorage: cacheStorage, navigator: browser })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else Reflect.deleteProperty(globalThis, name);
    });
  }

  let unavailable = true;
  const request = t.mock.method(globalThis, "fetch", async (url: string) => {
    assert.match(url, /^\/api\/catalog\/search\?q=/);
    if (unavailable) return Response.json({ error: "Unavailable", code: 503 }, { status: 503 });
    return Response.json({ data: { docs: [art] } });
  });

  await assert.rejects(searchOpenLibraryWithCache("art"), /no saved data/);
  assert.equal(storage.size, 0);
  unavailable = false;
  const fresh = await searchOpenLibraryWithCache("art");
  assert.equal(fresh.books[0]?.title, "Art");
  assert.equal(fresh.savedAt, null);
  unavailable = true;
  await assert.rejects(searchOpenLibraryWithCache("Dune"), /no saved data/);
  const saved = await searchOpenLibraryWithCache(" ART ");
  assert.deepEqual(saved.books, fresh.books);
  assert.ok(saved.savedAt);

  browser.onLine = false;
  const callsBeforeOffline = request.mock.callCount();
  assert.deepEqual(await searchOpenLibraryWithCache("art"), saved);
  await assert.rejects(searchOpenLibraryWithCache("Dune"), /You are offline/);
  await assert.rejects(searchOpenLibraryWithCache("art", AbortSignal.abort()), { name: "AbortError" });
  assert.equal(request.mock.callCount(), callsBeforeOffline);
});
