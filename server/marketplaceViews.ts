import type { HydratedDocument } from "mongoose";
import type { LibraryBook, Listing, OwnListing, PublicMember } from "@/types";
import type { LibraryBookDocument } from "../models/LibraryBook.js";
import { ListingModel } from "../models/Listing.js";
import type { ListingDocument } from "../models/Listing.js";
import { serializeBookMetadata } from "./bookMetadata.js";

function member(ref: unknown): PublicMember {
  if (typeof ref === "object" && ref !== null && "_id" in ref && "name" in ref) {
    return { id: String(ref._id), name: String(ref.name) };
  }
  return { id: String(ref), name: "Member" };
}

export function listingView(doc: HydratedDocument<ListingDocument>): Listing {
  return {
    id: String(doc._id), libraryBookId: String(doc.libraryBook), owner: member(doc.owner),
    book: serializeBookMetadata(doc.book), condition: doc.condition, description: doc.description,
    modality: doc.modality, terms: {
      desiredBook: doc.terms.desiredBook ? serializeBookMetadata(doc.terms.desiredBook) : null,
      priceCop: doc.terms.priceCop, durationDays: doc.terms.durationDays,
    },
    status: doc.status, closureReason: doc.closureReason,
    createdAt: doc.createdAt.toISOString(), updatedAt: doc.updatedAt.toISOString(),
  };
}

export function ownListingView(doc: HydratedDocument<ListingDocument>): OwnListing {
  return { ...listingView(doc), moderation: doc.moderation ? { reason: doc.moderation.reason, removedAt: doc.moderation.removedAt.toISOString() } : null };
}

export async function libraryView(doc: HydratedDocument<LibraryBookDocument>): Promise<LibraryBook> {
  const current = await ListingModel.findOne({ libraryBook: doc._id, status: { $in: ["Available", "Reserved"] } }).sort({ createdAt: -1, _id: -1 }).exec();
  return {
    id: String(doc._id), book: serializeBookMetadata(doc.book), condition: doc.condition,
    notes: doc.notes, status: doc.status,
    currentListing: current ? { id: String(current._id), modality: current.modality, status: current.status } : null,
    activity: null,
    lastModeration: doc.lastModeration ? { listingId: String(doc.lastModeration.listingId), reason: doc.lastModeration.reason, removedAt: doc.lastModeration.removedAt.toISOString() } : null,
    createdAt: doc.createdAt.toISOString(), updatedAt: doc.updatedAt.toISOString(),
  };
}
