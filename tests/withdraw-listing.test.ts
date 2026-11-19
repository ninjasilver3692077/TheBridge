import assert from "node:assert/strict";
import { afterEach, before, test } from "node:test";

type FetchCall = { url: string; method: string; authorization: string };

const calls: FetchCall[] = [];
const storage = new Map<string, string>();
const realFetch = globalThis.fetch;

function stubBrowser() {
  Object.assign(globalThis, {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => void storage.set(key, value),
      removeItem: (key: string) => void storage.delete(key),
    },
    window: {
      dispatchEvent: () => true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  });
  storage.set(
    "thebridge:session",
    JSON.stringify({
      token: "member-token",
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      account: { id: "a1", name: "Owner", role: "Member" },
    }),
  );
}

function stubFetch(status: number, body: unknown) {
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({
      url,
      method: init.method ?? "GET",
      authorization: (init.headers as Record<string, string>).Authorization ?? "",
    });
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
}

const book = { title: "Dune", author: "Frank Herbert", genre: "Sci-Fi", year: 1965, publisher: "Ace", language: "en", coverUrl: "" };

const closedListing = {
  id: "l1",
  libraryBookId: "b1",
  book,
  modality: "Loan",
  condition: "Good",
  description: "",
  terms: { desiredBook: null, priceCop: null, durationDays: 14, paymentMethods: null },
  owner: { id: "a1", name: "Owner" },
  status: "Closed",
  closureReason: "Withdrawn",
  createdAt: "2026-11-19T00:00:00.000Z",
};

before(stubBrowser);

afterEach(() => {
  globalThis.fetch = realFetch;
  calls.length = 0;
});

test("withdrawing a listing sends an authenticated DELETE and returns the closed listing", async () => {
  const { withdrawListing } = await import("../src/services/listings.js");
  stubFetch(200, { data: closedListing });
  const listing = await withdrawListing("l1");
  assert.deepEqual(calls, [{ url: "/api/listings/l1", method: "DELETE", authorization: "Bearer member-token" }]);
  assert.equal(listing.status, "Closed");
  assert.equal(listing.closureReason, "Withdrawn");
});

test("a changed listing answers 409 and the service raises that status", async () => {
  const { withdrawListing } = await import("../src/services/listings.js");
  stubFetch(409, { error: "The listing is no longer available.", code: 409 });
  await assert.rejects(
    () => withdrawListing("l1"),
    (error: { status: number; message: string }) =>
      error.status === 409 && error.message === "The listing is no longer available.",
  );
});

test("My Books carries the current listing status so only Available listings can be withdrawn", async () => {
  const { fetchMyBooks } = await import("../src/services/myBooks.js");
  const libraryBook = (id: string, status: string, listingStatus: string) => ({
    id,
    book,
    condition: "Good",
    notes: "",
    createdAt: "2026-11-19T00:00:00.000Z",
    status,
    currentListing: { id: `l-${id}`, modality: "Loan", status: listingStatus },
    activity: null,
    lastModeration: null,
    borrowedFrom: null,
  });
  stubFetch(200, {
    data: [libraryBook("b1", "Published", "Available"), libraryBook("b2", "Reserved", "Reserved"), { ...libraryBook("b3", "Available", "Closed"), currentListing: null }],
    meta: { totalPages: 1 },
  });
  const books = await fetchMyBooks();
  assert.deepEqual(books.map((item: { listingStatus: string | null }) => item.listingStatus), ["Available", "Reserved", null]);
});
