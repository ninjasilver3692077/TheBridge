import { Router } from "express";
import type { Request, Response } from "express";
import type { AdminListing, MemberSummary, Role } from "@/types";
import { AccountModel } from "../models/Account.js";
import { ListingModel } from "../models/Listing.js";
import { requireAuth, requireRole } from "../server/auth.js";
import { requireDatabase } from "../server/db.js";
import { methodNotAllowed } from "../server/errors.js";
import { bookSearch, listingStatus, queryInput, searchQuery } from "../server/marketplaceInput.js";
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
    const data: AdminListing[] = docs.map((doc) => ({
      ...listingView(doc),
      ownerEmail: ownerEmail(doc.owner),
      moderation: doc.moderation
        ? { reason: doc.moderation.reason, removedAt: doc.moderation.removedAt.toISOString(), removedBy: memberRef(doc.moderation.removedBy) }
        : null,
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
