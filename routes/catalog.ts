import { setTimeout as wait } from "node:timers/promises";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { HttpError, methodNotAllowed } from "../server/errors.js";

const searchFields = [
  "key",
  "title",
  "author_name",
  "first_publish_year",
  "edition_count",
  "cover_i",
  "publisher",
  "isbn",
  "language",
].join(",");

const catalogSearchLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new HttpError(429, "Too many catalog searches. Try again later."));
  },
});

function openLibraryUnavailable() {
  return new HttpError(503, "Open Library is unavailable. Try again later.");
}

const retryableStatuses = new Set([500, 502, 503, 504]);
const firstAttemptTimeoutMs = 5_000;
const searchTimeoutMs = 9_000;
const retryDelayMs = 1_000;

async function requestOpenLibraryDocs(url: URL, signal: AbortSignal) {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TheBridge (+https://github.com/ninjasilver3692077/TheBridge)",
      },
      redirect: "error",
      signal,
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    if (retryableStatuses.has(response.status) && !response.headers.has("Retry-After")) {
      return null;
    }
    throw openLibraryUnavailable();
  }

  let data: { docs?: unknown } | null;
  try {
    data = await response.json();
  } catch {
    if (signal.aborted) return null;
    throw openLibraryUnavailable();
  }

  if (!Array.isArray(data?.docs)) throw openLibraryUnavailable();
  return data.docs.slice(0, 20);
}

async function fetchOpenLibraryDocs(query: string, clientSignal: AbortSignal) {
  const url = new URL("https://openlibrary.org/search.json");
  url.search = new URLSearchParams({
    q: query,
    limit: "20",
    fields: searchFields,
  }).toString();

  const searchSignal = AbortSignal.any([clientSignal, AbortSignal.timeout(searchTimeoutMs)]);
  const firstAttemptSignal = AbortSignal.any([
    searchSignal,
    AbortSignal.timeout(firstAttemptTimeoutMs),
  ]);
  const docs = await requestOpenLibraryDocs(url, firstAttemptSignal);
  if (docs !== null) return docs;

  try {
    await wait(retryDelayMs, undefined, { signal: searchSignal });
  } catch {
    throw openLibraryUnavailable();
  }

  const retriedDocs = await requestOpenLibraryDocs(url, searchSignal);
  if (retriedDocs === null) throw openLibraryUnavailable();
  return retriedDocs;
}

export const catalogRouter = Router();

catalogRouter.route("/catalog/search")
  .get(catalogSearchLimiter, async (req, res) => {
    const params = req.query;
    const query = typeof params.q === "string" ? params.q.trim() : "";
    if (Object.keys(params).length !== 1 || query.length < 3 || query.length > 100) {
      throw new HttpError(400, "q: enter a single search query between 3 and 100 characters.");
    }

    const client = new AbortController();
    res.once("close", () => client.abort());
    try {
      const docs = await fetchOpenLibraryDocs(query, client.signal);
      res.json({ data: { docs } });
    } catch (error) {
      if (!client.signal.aborted) throw error;
    }
  })
  .all(methodNotAllowed(["GET", "HEAD"]));
