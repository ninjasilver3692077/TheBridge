import { Router } from "express";
import type { Request, Response } from "express";
import type { Condition, ListingStats, Modality } from "@/types";
import { ListingModel } from "../models/Listing.js";
import { currentAccount, requireAuth, requireRole } from "../server/auth.js";
import { requireDatabase } from "../server/db.js";
import { HttpError, methodNotAllowed } from "../server/errors.js";
import { changeListing, publishListing } from "../server/marketplaceCommands.js";
import { bookSearch, listingInput, listingStatus, objectId, publicListingFilter, queryInput } from "../server/marketplaceInput.js";
import { listingView, ownListingView } from "../server/marketplaceViews.js";
import { readPagination, toPage } from "../server/pagination.js";

export const listingsRouter = Router();
const member = [requireDatabase, requireAuth, requireRole("Member")];
const filterKeys = ["q", "modality", "genre", "condition"];

listingsRouter.route("/listings/stats")
  .get(requireDatabase, async (req: Request, res: Response) => {
    queryInput(req.query, filterKeys);
    const filter = publicListingFilter(req.query);
    const grouped = await ListingModel.aggregate<{ _id: Modality; count: number; average: number | null }>([
      { $match: filter }, { $group: { _id: "$modality", count: { $sum: 1 }, average: { $avg: "$terms.priceCop" } } },
    ]).exec();
    const stats: ListingStats = { total: 0, byModality: { Exchange: 0, Loan: 0, Rental: 0, Sale: 0 }, averageSalePriceCop: null, averageRentalPriceCop: null, facets: { genres: [], conditions: [] } };
    for (const group of grouped) {
      stats.total += group.count;
      stats.byModality[group._id] = group.count;
      if (group._id === "Sale") stats.averageSalePriceCop = group.average === null ? null : Math.round(group.average);
      if (group._id === "Rental") stats.averageRentalPriceCop = group.average === null ? null : Math.round(group.average);
    }
    stats.facets.genres = (await ListingModel.distinct("book.genre", { status: "Available" }).exec()).sort();
    stats.facets.conditions = (await ListingModel.distinct("condition", { status: "Available" }).exec()).sort() as Condition[];
    res.json({ data: stats });
  })
  .all(methodNotAllowed(["GET", "HEAD"]));

listingsRouter.route("/listings/mine")
  .get(...member, async (req: Request, res: Response) => {
    queryInput(req.query, ["page", "limit", "status", "q"]);
    const pagination = readPagination(req.query);
    const filter = { owner: currentAccount(res).id, ...bookSearch(req.query.q, "book"), ...(req.query.status === undefined ? {} : { status: listingStatus(req.query.status) }) };
    const total = await ListingModel.countDocuments(filter).exec();
    const docs = await ListingModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip(pagination.skip).limit(pagination.limit).populate("owner", "name").exec();
    res.set("Cache-Control", "no-store").json(toPage(docs.map(ownListingView), total, pagination));
  })
  .all(methodNotAllowed(["GET", "HEAD"]));

listingsRouter.route("/listings")
  .get(requireDatabase, async (req: Request, res: Response) => {
    queryInput(req.query, ["page", "limit", ...filterKeys]);
    const pagination = readPagination(req.query);
    const filter = publicListingFilter(req.query);
    const total = await ListingModel.countDocuments(filter).exec();
    const docs = await ListingModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip(pagination.skip).limit(pagination.limit).populate("owner", "name").exec();
    res.json(toPage(docs.map(listingView), total, pagination));
  })
  .post(...member, async (req: Request, res: Response) => {
    const doc = await publishListing(currentAccount(res).id, listingInput(req.body, true));
    await doc.populate("owner", "name");
    res.status(201).json({ data: listingView(doc) });
  })
  .all(methodNotAllowed(["GET", "HEAD", "POST"]));

listingsRouter.route("/listings/:id")
  .get(requireDatabase, async (req: Request<{ id: string }>, res: Response) => {
    const doc = await ListingModel.findOne({ _id: objectId(req.params.id), status: { $ne: "Removed" } }).populate("owner", "name").exec();
    if (!doc) throw new HttpError(404, "Listing not found.");
    res.json({ data: listingView(doc) });
  })
  .patch(...member, async (req: Request<{ id: string }>, res: Response) => {
    const doc = await changeListing(objectId(req.params.id), currentAccount(res).id, listingInput(req.body));
    await doc.populate("owner", "name");
    res.set("Cache-Control", "no-store").json({ data: listingView(doc) });
  })
  .delete(...member, async (req: Request<{ id: string }>, res: Response) => {
    const doc = await changeListing(objectId(req.params.id), currentAccount(res).id, null);
    await doc.populate("owner", "name");
    res.set("Cache-Control", "no-store").json({ data: listingView(doc) });
  })
  .all(methodNotAllowed(["GET", "HEAD", "PATCH", "DELETE"]));
