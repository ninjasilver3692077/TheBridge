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

async function fetchOpenLibraryDocs(query: string) {
  const url = new URL("https://openlibrary.org/search.json");
  url.search = new URLSearchParams({
    q: query,
    limit: "20",
    fields: searchFields,
  }).toString();

  let data: { docs?: unknown } | null;
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TheBridge (+https://github.com/ninjasilver3692077/TheBridge)",
      },
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw openLibraryUnavailable();
    }
    data = await response.json();
  } catch {
    throw openLibraryUnavailable();
  }

  if (!Array.isArray(data?.docs)) throw openLibraryUnavailable();
  return data.docs.slice(0, 20);
}

export const catalogRouter = Router();

catalogRouter.route("/catalog/search")
  .get(catalogSearchLimiter, async (req, res) => {
    const params = req.query;
    const query = typeof params.q === "string" ? params.q.trim() : "";
    if (Object.keys(params).length !== 1 || query.length < 3 || query.length > 100) {
      throw new HttpError(400, "q: enter a single search query between 3 and 100 characters.");
    }

    const docs = await fetchOpenLibraryDocs(query);
    res.json({ data: { docs } });
  })
  .all(methodNotAllowed(["GET", "HEAD"]));
