import { Router } from "express";
import type { Request, Response } from "express";
import type { HydratedDocument } from "mongoose";
import type { AdminListing, AdminOverview, AdminRequest, ListingStatus, MemberSummary, RequestStatus, Role } from "@/types";
import { AccountModel } from "../models/Account.js";
import { ListingModel } from "../models/Listing.js";
import type { ListingDocument } from "../models/Listing.js";
import { REQUEST_STATUSES, RequestModel, toBookRequestDto } from "../models/Request.js";
import { deleteAccountByAdmin } from "../server/accountManagement.js";
import { currentAccount, requireAuth, requireRole } from "../server/auth.js";
import { requireDatabase } from "../server/db.js";
import { HttpError, methodNotAllowed } from "../server/errors.js";
import { removeListing } from "../server/marketplaceCommands.js";
import { bookSearch, listingStatus, objectId, objectInput, queryInput, readEnum, searchQuery } from "../server/marketplaceInput.js";
import { LISTING_STATUSES } from "../server/listingTerms.js";
import { listingView } from "../server/marketplaceViews.js";
import { readPagination, toPage } from "../server/pagination.js";

export const adminRouter = Router();
const admin = [requireDatabase, requireAuth, requireRole("Admin")];

function memberRef(ref: unknown): { id: string; name: string } {
  if (typeof ref === "object" && ref !== null && "_id" in ref && "name" in ref) {
    return { id: String(ref._id), name: String(ref.name) };
  }
  return { id: String(ref), name: "Member" };
}

function ownerEmail(owner: unknown): string {
  return typeof owner === "object" && owner !== null && "email" in owner ? String(owner.email) : "";
}

function adminListingView(doc: HydratedDocument<ListingDocument>): AdminListing {
  return {
    ...listingView(doc),
    ownerEmail: ownerEmail(doc.owner),
    moderation: doc.moderation
      ? { reason: doc.moderation.reason, removedAt: doc.moderation.removedAt.toISOString(), removedBy: memberRef(doc.moderation.removedBy) }
      : null,
  };
}

function countsByStatus<S extends string>(statuses: readonly S[], grouped: { _id: S; count: number }[]): Record<S, number> {
  const counts = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<S, number>;
  for (const group of grouped) counts[group._id] = group.count;
  return counts;
}

function readReason(raw: unknown): string {
  const body = objectInput(raw, ["reason"]);
  if (typeof body.reason !== "string") throw new HttpError(400, "reason: must be text.");
  const reason = body.reason.trim();
  if (reason.length < 1 || reason.length > 500) throw new HttpError(400, "reason: must be 1 to 500 characters.");
  return reason;
}

adminRouter.route("/admin/overview")
  .get(...admin, async (req: Request, res: Response) => {
    queryInput(req.query, []);
    const [memberCount, listings, requests] = await Promise.all([
      AccountModel.countDocuments({ role: "Member" }).exec(),
      ListingModel.aggregate<{ _id: ListingStatus; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]).exec(),
      RequestModel.aggregate<{ _id: RequestStatus; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]).exec(),
    ]);
    const overview: AdminOverview = {
      memberCount,
      listingsByStatus: countsByStatus(LISTING_STATUSES, listings),
      requestsByStatus: countsByStatus(REQUEST_STATUSES, requests),
    };
    res.set("Cache-Control", "no-store").json({ data: overview });
  })
  .all(methodNotAllowed(["GET", "HEAD"]));

adminRouter.route("/admin/listings")
  .get(...admin, async (req: Request, res: Response) => {
    queryInput(req.query, ["page", "limit", "q", "status"]);
    const pagination = readPagination(req.query);
    const regex = searchQuery(req.query.q);
    const matchingOwners = regex
      ? await AccountModel.find({ $or: [{ name: regex }, { email: regex }] }).distinct("_id").exec()
      : [];
    const filter = {
      ...(req.query.status === undefined ? {} : { status: listingStatus(req.query.status) }),
      ...(regex ? { $or: [...(bookSearch(req.query.q, "book").$or as object[]), { owner: { $in: matchingOwners } }] } : {}),
    };
    const total = await ListingModel.countDocuments(filter).exec();
    const docs = await ListingModel.find(filter)
      .sort({ createdAt: -1, _id: -1 }).skip(pagination.skip).limit(pagination.limit)
      .populate("owner", "name email").populate("moderation.removedBy", "name").exec();
    const data = docs.map(adminListingView);
    res.set("Cache-Control", "no-store").json(toPage(data, total, pagination));
  })
  .all(methodNotAllowed(["GET", "HEAD"]));

adminRouter.route("/admin/listings/:id")
  .delete(...admin, async (req: Request<{ id: string }>, res: Response) => {
    const id = objectId(req.params.id);
    const reason = readReason(req.body);
    const removed = await removeListing(id, currentAccount(res).id, reason);
    await removed.populate([{ path: "owner", select: "name email" }, { path: "moderation.removedBy", select: "name" }]);
    res.set("Cache-Control", "no-store").json({ data: adminListingView(removed) });
  })
  .all(methodNotAllowed(["DELETE"]));

adminRouter.route("/admin/requests")
  .get(...admin, async (req: Request, res: Response) => {
    queryInput(req.query, ["page", "limit", "q", "status"]);
    const pagination = readPagination(req.query);
    const regex = searchQuery(req.query.q);
    const matchingMembers = regex
      ? await AccountModel.find({ $or: [{ name: regex }, { email: regex }] }).distinct("_id").exec()
      : [];
    const filter = {
      ...(req.query.status === undefined ? {} : { status: readEnum(req.query.status, REQUEST_STATUSES, "status") }),
      ...(regex
        ? { $or: [{ "listingSummary.title": regex }, { "listingSummary.author": regex }, { owner: { $in: matchingMembers } }, { requester: { $in: matchingMembers } }] }
        : {}),
    };
    const total = await RequestModel.countDocuments(filter).exec();
    const docs = await RequestModel.find(filter)
      .sort({ createdAt: -1, _id: -1 }).skip(pagination.skip).limit(pagination.limit)
      .populate("owner", "name email").populate("requester", "name email").populate("listing", "status").exec();
    const data: AdminRequest[] = docs.map((doc) => ({
      ...toBookRequestDto(doc),
      ownerEmail: ownerEmail(doc.owner),
      requesterEmail: ownerEmail(doc.requester),
    }));
    res.set("Cache-Control", "no-store").json(toPage(data, total, pagination));
  })
  .all(methodNotAllowed(["GET", "HEAD"]));

adminRouter.route("/admin/members")
  .get(...admin, async (req: Request, res: Response) => {
    queryInput(req.query, ["page", "limit", "q"]);
    const pagination = readPagination(req.query);
    const regex = searchQuery(req.query.q);
    const filter = { role: "Member" as Role, ...(regex ? { $or: [{ name: regex }, { email: regex }] } : {}) };
    const total = await AccountModel.countDocuments(filter).exec();
    const docs = await AccountModel.find(filter)
      .sort({ createdAt: -1, _id: -1 }).skip(pagination.skip).limit(pagination.limit).exec();
    const data: MemberSummary[] = docs.map((doc) => ({
      id: String(doc._id), name: doc.name, email: doc.email, createdAt: doc.createdAt.toISOString(),
    }));
    res.set("Cache-Control", "no-store").json(toPage(data, total, pagination));
  })
  .all(methodNotAllowed(["GET", "HEAD"]));

adminRouter.route("/admin/accounts/:id")
  .delete(...admin, async (req: Request<{ id: string }>, res: Response) => {
    const id = objectId(req.params.id);
    if (req.body !== undefined) objectInput(req.body, []);
    const deleted = await deleteAccountByAdmin(id, currentAccount(res).id);
    res.set("Cache-Control", "no-store").json({ data: deleted });
  })
  .all(methodNotAllowed(["DELETE"]));
