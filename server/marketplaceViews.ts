import type { HydratedDocument, Types } from "mongoose";
import type { CurrentListingSummary, LibraryBook, LibraryBookActivity, Listing, OwnListing, PublicMember, RequestStatus } from "@/types";
import { AccountModel } from "../models/Account.js";
import type { LibraryBookDocument } from "../models/LibraryBook.js";
import { ListingModel } from "../models/Listing.js";
import type { ListingDocument } from "../models/Listing.js";
import { RequestModel } from "../models/Request.js";
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

const ACTIVE_REQUEST_STATUSES: RequestStatus[] = ["Pending", "Accepted"];

interface ActivityCandidate {
  copyId: string;
  kind: LibraryBookActivity["kind"];
  counterpartId: string;
  requestId: string;
  status: LibraryBookActivity["status"];
  createdAt: number;
}

function outranks(candidate: ActivityCandidate, held: ActivityCandidate | undefined): boolean {
  if (!held) return true;
  if (candidate.status !== held.status) return candidate.status === "Accepted";
  if (candidate.createdAt !== held.createdAt) return candidate.createdAt > held.createdAt;
  return candidate.requestId > held.requestId;
}

async function copyActivities(copyIds: Types.ObjectId[], listings: { _id: Types.ObjectId; libraryBook: Types.ObjectId }[]): Promise<Map<string, LibraryBookActivity>> {
  const copyByListing = new Map(listings.map((listing) => [String(listing._id), String(listing.libraryBook)]));
  const [received, offered] = await Promise.all([
    RequestModel.find({ listing: { $in: listings.map((listing) => listing._id) }, status: { $in: ACTIVE_REQUEST_STATUSES } }).exec(),
    RequestModel.find({ offeredBook: { $in: copyIds }, status: { $in: ACTIVE_REQUEST_STATUSES } }).exec(),
  ]);
  const candidates: ActivityCandidate[] = [
    ...received.map((request) => ({
      copyId: copyByListing.get(String(request.listing)) ?? "", kind: "ReceivedRequest" as const,
      counterpartId: String(request.requester), requestId: String(request._id),
      status: request.status as LibraryBookActivity["status"], createdAt: request.createdAt.getTime(),
    })),
    ...offered.map((request) => ({
      copyId: String(request.offeredBook), kind: "OfferedExchange" as const,
      counterpartId: String(request.owner), requestId: String(request._id),
      status: request.status as LibraryBookActivity["status"], createdAt: request.createdAt.getTime(),
    })),
  ];
  const accounts = await AccountModel.find({ _id: { $in: candidates.map((candidate) => candidate.counterpartId) } }).select("name").exec();
  const names = new Map(accounts.map((account) => [String(account._id), account.name]));
  const best = new Map<string, ActivityCandidate>();
  for (const candidate of candidates) {
    if (outranks(candidate, best.get(candidate.copyId))) best.set(candidate.copyId, candidate);
  }
  return new Map([...best].map(([copyId, candidate]) => [copyId, {
    requestId: candidate.requestId, status: candidate.status, kind: candidate.kind,
    counterpart: { id: candidate.counterpartId, name: names.get(candidate.counterpartId) ?? "Member" },
  }]));
}

function libraryProjection(doc: HydratedDocument<LibraryBookDocument>, current: CurrentListingSummary | null, activity: LibraryBookActivity | null, lenderNames: Map<string, string>): LibraryBook {
  return {
    id: String(doc._id), book: serializeBookMetadata(doc.book), condition: doc.condition,
    notes: doc.notes, status: doc.status,
    currentListing: current,
    activity,
    borrowedFrom: doc.borrowedFrom ? { id: String(doc.borrowedFrom), name: lenderNames.get(String(doc.borrowedFrom)) ?? "Member" } : null,
    lastModeration: doc.lastModeration ? { listingId: String(doc.lastModeration.listingId), reason: doc.lastModeration.reason, removedAt: doc.lastModeration.removedAt.toISOString() } : null,
    createdAt: doc.createdAt.toISOString(), updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function libraryViews(docs: HydratedDocument<LibraryBookDocument>[]): Promise<LibraryBook[]> {
  if (docs.length === 0) return [];
  const copyIds = docs.map((doc) => doc._id);
  const listings = await ListingModel.find({ libraryBook: { $in: copyIds } })
    .select("libraryBook modality status").sort({ createdAt: -1, _id: -1 }).exec();
  const currentByCopy = new Map<string, CurrentListingSummary>();
  for (const listing of listings) {
    const copyId = String(listing.libraryBook);
    const isOpen = listing.status === "Available" || listing.status === "Reserved";
    if (isOpen && !currentByCopy.has(copyId)) currentByCopy.set(copyId, { id: String(listing._id), modality: listing.modality, status: listing.status });
  }
  const activities = await copyActivities(copyIds, listings);
  const lenderIds = docs.flatMap((doc) => (doc.borrowedFrom ? [doc.borrowedFrom] : []));
  const lenders = lenderIds.length === 0 ? [] : await AccountModel.find({ _id: { $in: lenderIds } }).select("name").exec();
  const lenderNames = new Map(lenders.map((lender) => [String(lender._id), lender.name]));
  return docs.map((doc) => libraryProjection(doc, currentByCopy.get(String(doc._id)) ?? null, activities.get(String(doc._id)) ?? null, lenderNames));
}

export async function libraryView(doc: HydratedDocument<LibraryBookDocument>): Promise<LibraryBook> {
  const [view] = await libraryViews([doc]);
  return view as LibraryBook;
}
