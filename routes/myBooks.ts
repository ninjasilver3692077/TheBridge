import { Router } from "express";
import type { Request, Response } from "express";
import type { EditBookInput } from "@/types";
import { LibraryBookModel, LIBRARY_BOOK_STATUSES } from "../models/LibraryBook.js";
import { currentAccount, requireAuth, requireRole } from "../server/auth.js";
import { parseBookMetadataInput } from "../server/bookMetadata.js";
import { requireDatabase } from "../server/db.js";
import { HttpError, methodNotAllowed } from "../server/errors.js";
import { changeCopy } from "../server/marketplaceCommands.js";
import { bookSearch, objectId, objectInput, queryInput, readCondition, readEnum, readNotes } from "../server/marketplaceInput.js";
import { libraryView } from "../server/marketplaceViews.js";
import { readPagination, toPage } from "../server/pagination.js";

export const myBooksRouter = Router();
const member = [requireDatabase, requireAuth, requireRole("Member")];

myBooksRouter.use("/my-books", (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

myBooksRouter.route("/my-books")
  .get(...member, async (req: Request, res: Response) => {
    queryInput(req.query, ["page", "limit", "status", "q"]);
    const pagination = readPagination(req.query);
    const status = req.query.status === undefined ? { $ne: "Transferred" as const } : readEnum(req.query.status, LIBRARY_BOOK_STATUSES, "status");
    const filter = { owner: currentAccount(res).id, status, ...bookSearch(req.query.q, "book") };
    const total = await LibraryBookModel.countDocuments(filter).exec();
    const docs = await LibraryBookModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip(pagination.skip).limit(pagination.limit).exec();
    res.json(toPage(await Promise.all(docs.map(libraryView)), total, pagination));
  })
  .post(...member, async (req: Request, res: Response) => {
    const body = objectInput(req.body, ["book", "condition", "notes"]);
    const doc = await LibraryBookModel.create({ owner: currentAccount(res).id, book: parseBookMetadataInput(body.book), condition: readCondition(body.condition), notes: body.notes === undefined ? "" : readNotes(body.notes) });
    res.status(201).json({ data: await libraryView(doc) });
  })
  .all(methodNotAllowed(["GET", "HEAD", "POST"]));

myBooksRouter.route("/my-books/:id")
  .get(...member, async (req: Request<{ id: string }>, res: Response) => {
    const doc = await LibraryBookModel.findOne({ _id: objectId(req.params.id), owner: currentAccount(res).id }).exec();
    if (!doc) throw new HttpError(404, "Library book not found.");
    res.json({ data: await libraryView(doc) });
  })
  .patch(...member, async (req: Request<{ id: string }>, res: Response) => {
    const body = objectInput(req.body, ["condition", "notes"]);
    if (Object.keys(body).length === 0) throw new HttpError(400, "body: provide condition or notes.");
    const input: EditBookInput = {};
    if ("condition" in body) input.condition = readCondition(body.condition);
    if ("notes" in body) input.notes = readNotes(body.notes);
    const doc = await changeCopy(objectId(req.params.id), currentAccount(res).id, input);
    if (!doc) throw new HttpError(404, "Library book not found.");
    res.json({ data: await libraryView(doc) });
  })
  .delete(...member, async (req: Request<{ id: string }>, res: Response) => {
    const id = objectId(req.params.id);
    await changeCopy(id, currentAccount(res).id, null);
    res.json({ data: { id, deleted: true } });
  })
  .all(methodNotAllowed(["GET", "HEAD", "PATCH", "DELETE"]));
