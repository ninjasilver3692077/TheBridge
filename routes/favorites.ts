import { Router } from "express";
import type { Request, Response } from "express";
import type { DataResponse, Favorite, PageResponse } from "@/types";
import {
  FavoriteModel,
  isPlainObject,
  parseBookMetadataInput,
  toFavoriteDto,
} from "../models/Favorite.js";
import { currentAccount, requireAuth, requireRole } from "../server/auth.js";
import { requireDatabase } from "../server/db.js";
import { HttpError, methodNotAllowed } from "../server/errors.js";
import { readPagination, toPage } from "../server/pagination.js";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const allowedQueryKeys = new Set(["page", "limit", "q"]);

const accentClasses: Record<string, string> = {
  a: "[aáàäâã]",
  e: "[eéèëê]",
  i: "[iíìïî]",
  o: "[oóòöôõ]",
  u: "[uúùüû]",
  n: "[nñ]",
  c: "[cç]",
};

export function readObjectId(value: unknown, field = "id"): string {
  if (typeof value !== "string" || !objectIdPattern.test(value)) {
    throw new HttpError(400, `${field}: must be a 24-character hex identifier.`);
  }
  return value;
}

export function readSearchQuery(raw: unknown): RegExp | null {
  if (raw === undefined) return null;
  if (typeof raw !== "string") {
    throw new HttpError(400, "q: must be a string.");
  }
  const trimmed = raw.trim();
  if (trimmed.length > 100) {
    throw new HttpError(400, "q: must be at most 100 characters.");
  }
  if (trimmed.length === 0) return null;

  const base = trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped.replace(/[aeiounc]/g, (char) => accentClasses[char] ?? char);
  return new RegExp(pattern, "i");
}

export function assertAllowedQueryKeys(
  query: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): void {
  for (const key of Object.keys(query)) {
    if (!allowed.has(key)) {
      throw new HttpError(400, `${key}: unknown query parameter.`);
    }
  }
}

export const favoritesRouter = Router();

favoritesRouter.use("/favorites", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});


favoritesRouter
  .route("/favorites")
  .get(
    requireDatabase,
    requireAuth,
    requireRole("Member"),
    async (req: Request, res: Response<PageResponse<Favorite>>) => {
      const query = req.query as Record<string, unknown>;
      assertAllowedQueryKeys(query, allowedQueryKeys);
      const pagination = readPagination(query);
      const searchRegex = readSearchQuery(query.q);
      const account = currentAccount(res);

      const filter: Record<string, unknown> = { owner: account.id };
      if (searchRegex) {
        filter.$or = [
          { "book.title": searchRegex },
          { "book.author": searchRegex },
          { "book.genre": searchRegex },
          { "book.isbn": searchRegex },
        ];
      }

      const [total, docs] = await Promise.all([
        FavoriteModel.countDocuments(filter).exec(),
        FavoriteModel.find(filter)
          .sort({ createdAt: -1, _id: -1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .exec(),
      ]);

      res.json(toPage(docs.map(toFavoriteDto), total, pagination));
    },
  )
  .post(
    requireDatabase,
    requireAuth,
    requireRole("Member"),
    async (req: Request, res: Response<DataResponse<Favorite>>) => {
      if (!isPlainObject(req.body)) {
        throw new HttpError(400, "body: must be a JSON object.");
      }
      for (const key of Object.keys(req.body)) {
        if (key !== "book") {
          throw new HttpError(400, `${key}: unknown field.`);
        }
      }
      if (!("book" in req.body)) {
        throw new HttpError(400, "book: required field.");
      }

      const book = parseBookMetadataInput(req.body.book, "book");
      const account = currentAccount(res);

      const existing = await FavoriteModel.findOne({
        owner: account.id,
        "book.catalogId": book.catalogId,
      }).exec();
      if (existing) {
        throw new HttpError(409, "This book is already in your favorites.");
      }

      const created = await FavoriteModel.create({
        owner: account.id,
        book,
      });

      res.status(201).json({ data: toFavoriteDto(created) });
    },
  )
  .all(methodNotAllowed(["GET", "HEAD", "POST"]));

favoritesRouter
  .route("/favorites/:id")
  .delete(
    requireDatabase,
    requireAuth,
    requireRole("Member"),
    async (
      req: Request<{ id: string }>,
      res: Response<DataResponse<{ id: string; deleted: true }>>,
    ) => {
      const favoriteId = readObjectId(req.params.id, "id");
      const account = currentAccount(res);

      const deleted = await FavoriteModel.findOneAndDelete({
        _id: favoriteId,
        owner: account.id,
      }).exec();
      if (!deleted) {
        throw new HttpError(404, "Favorite not found.");
      }

      res.json({ data: { id: String(deleted._id), deleted: true } });
    },
  )
  .all(methodNotAllowed(["DELETE"]));

