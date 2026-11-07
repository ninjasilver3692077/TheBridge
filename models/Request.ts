import mongoose, { Schema } from "mongoose";
import type { HydratedDocument, Types } from "mongoose";
import type {
  BookRequest,
  Condition,
  DurationDays,
  ListingStatus,
  ListingTerms,
  Modality,
  OfferedBookSnapshot,
  PublicMember,
  RejectionReason,
  RequestListingSummary,
  RequestStatus,
} from "@/types";
import { bookMetadataSchema, serializeBookMetadata } from "./Favorite.js";

export const CONDITIONS: readonly Condition[] = ["Like new", "Good condition", "Used copy"];
export const MODALITIES: readonly Modality[] = ["Exchange", "Loan", "Rental", "Sale"];
export const DURATION_DAYS: readonly DurationDays[] = [7, 10, 14, 21];
export const LISTING_STATUSES: readonly ListingStatus[] = [
  "Available",
  "Reserved",
  "Closed",
  "Removed",
];
export const REQUEST_STATUSES: readonly RequestStatus[] = [
  "Pending",
  "Accepted",
  "Rejected",
  "Cancelled",
  "Completed",
];
export const REJECTION_REASONS: readonly RejectionReason[] = [
  "OwnerRejected",
  "CompetingRequestAccepted",
  "ListingWithdrawn",
  "ListingRemoved",
];

export function areValidTermsForModality(modality: Modality, terms: ListingTerms): boolean {
  const validPrice =
    terms.priceCop !== null &&
    Number.isInteger(terms.priceCop) &&
    terms.priceCop >= 1 &&
    terms.priceCop <= 1_000_000_000;
  const validDuration =
    terms.durationDays !== null && DURATION_DAYS.includes(terms.durationDays);

  if (modality === "Exchange") {
    return terms.priceCop === null && terms.durationDays === null;
  }
  if (modality === "Loan") {
    return terms.desiredBook === null && terms.priceCop === null && validDuration;
  }
  if (modality === "Rental") {
    return terms.desiredBook === null && validPrice && validDuration;
  }
  return terms.desiredBook === null && validPrice && terms.durationDays === null;
}

export const listingTermsSchema = new Schema<ListingTerms>(
  {
    desiredBook: { type: bookMetadataSchema, default: null },
    priceCop: {
      type: Number,
      default: null,
      validate: {
        validator: (value: number | null) =>
          value === null || (Number.isInteger(value) && value >= 1 && value <= 1_000_000_000),
        message: "must be null or a positive whole COP amount up to 1000000000.",
      },
    },
    durationDays: {
      type: Number,
      default: null,
      validate: {
        validator: (value: number | null) =>
          value === null || DURATION_DAYS.includes(value as DurationDays),
        message: "must be null or one of 7, 10, 14, 21.",
      },
    },
  },
  { _id: false },
);

const offeredBookSnapshotSchema = new Schema<OfferedBookSnapshot>(
  {
    id: { type: String, required: true, trim: true },
    book: { type: bookMetadataSchema, required: true },
    condition: { type: String, enum: CONDITIONS, required: true },
  },
  { _id: false },
);

const requestListingSummarySchema = new Schema<RequestListingSummary>(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 300 },
    author: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
    coverUrl: { type: String, default: null },
    modality: { type: String, enum: MODALITIES, required: true },
    status: { type: String, enum: LISTING_STATUSES, required: true, default: "Available" },
  },
  { _id: false },
);

export interface RequestDocument {
  listing: Types.ObjectId;
  owner: Types.ObjectId;
  requester: Types.ObjectId;
  offeredBook: Types.ObjectId | null;
  offeredBookSnapshot: OfferedBookSnapshot | null;
  listingSummary: RequestListingSummary;
  status: RequestStatus;
  rejectionReason: RejectionReason | null;
  quotedModality: Modality;
  quotedTerms: ListingTerms;
  createdAt: Date;
  updatedAt: Date;
}

const requestSchema = new Schema<RequestDocument>(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    requester: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    offeredBook: {
      type: Schema.Types.ObjectId,
      ref: "LibraryBook",
      default: null,
      validate: {
        validator: function (value: Types.ObjectId | null) {
          const doc = this as unknown as Partial<RequestDocument>;
          if (doc.quotedModality === "Exchange") {
            return value !== null && doc.offeredBookSnapshot !== null;
          }
          return value === null && doc.offeredBookSnapshot === null;
        },
        message: "offeredBook is required for Exchange and must be null otherwise.",
      },
    },
    offeredBookSnapshot: { type: offeredBookSnapshotSchema, default: null },
    listingSummary: { type: requestListingSummarySchema, required: true },
    status: {
      type: String,
      enum: REQUEST_STATUSES,
      required: true,
      default: "Pending",
    },
    rejectionReason: {
      type: String,
      default: null,
      validate: {
        validator: function (value: string | null) {
          const doc = this as unknown as Partial<RequestDocument>;
          if (doc.status === "Rejected") {
            return value !== null && REJECTION_REASONS.includes(value as RejectionReason);
          }
          return value === null;
        },
        message: "rejectionReason is required when Rejected and must be null otherwise.",
      },
    },
    quotedModality: { type: String, enum: MODALITIES, required: true },
    quotedTerms: {
      type: listingTermsSchema,
      required: true,
      validate: {
        validator: function (value: ListingTerms) {
          const doc = this as unknown as Partial<RequestDocument>;
          return Boolean(
            doc.quotedModality && value && areValidTermsForModality(doc.quotedModality, value),
          );
        },
        message: "terms do not match quotedModality.",
      },
    },
  },
  { timestamps: true },
);

requestSchema.index(
  { listing: 1, requester: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["Pending", "Accepted"] } } },
);
requestSchema.index(
  { listing: 1 },
  { unique: true, partialFilterExpression: { status: "Accepted" } },
);
requestSchema.index(
  { offeredBook: 1 },
  {
    unique: true,
    partialFilterExpression: {
      offeredBook: { $type: "objectId" },
      status: { $in: ["Pending", "Accepted"] },
    },
  },
);
requestSchema.index({ owner: 1, createdAt: -1, _id: -1 });
requestSchema.index({ requester: 1, createdAt: -1, _id: -1 });

function extractMember(refValue: unknown, fallbackName = "Member"): PublicMember {
  if (typeof refValue === "object" && refValue !== null && "name" in refValue) {
    const populated = refValue as { _id?: unknown; id?: unknown; name: unknown };
    const rawId = populated._id ?? populated.id ?? "";
    return {
      id: String(rawId),
      name: typeof populated.name === "string" ? populated.name : fallbackName,
    };
  }
  return { id: String(refValue), name: fallbackName };
}

export function extractId(refValue: unknown): string {
  if (typeof refValue === "object" && refValue !== null) {
    if ("_id" in refValue && (refValue as { _id?: unknown })._id !== undefined) {
      return String((refValue as { _id: unknown })._id);
    }
    if ("id" in refValue && typeof (refValue as { id?: unknown }).id === "string") {
      return (refValue as { id: string }).id;
    }
  }
  return String(refValue);
}

function extractListingStatus(refValue: unknown, fallback: ListingStatus): ListingStatus {
  if (
    typeof refValue === "object" &&
    refValue !== null &&
    "status" in refValue &&
    typeof (refValue as { status?: unknown }).status === "string"
  ) {
    const status = (refValue as { status: string }).status as ListingStatus;
    if (LISTING_STATUSES.includes(status)) return status;
  }
  return fallback;
}

export function serializeTerms(terms: ListingTerms): ListingTerms {
  return {
    desiredBook: terms.desiredBook ? serializeBookMetadata(terms.desiredBook) : null,
    priceCop: terms.priceCop ?? null,
    durationDays: terms.durationDays ?? null,
  };
}

export function toBookRequestDto(
  doc: HydratedDocument<RequestDocument>,
  overrides?: {
    owner?: PublicMember;
    requester?: PublicMember;
    listingStatus?: ListingStatus;
  },
): BookRequest {
  const listingId = extractId(doc.listing);
  const currentStatus =
    overrides?.listingStatus ?? extractListingStatus(doc.listing, doc.listingSummary.status);
  const offeredBookSnapshot = doc.offeredBookSnapshot
    ? {
        id: doc.offeredBookSnapshot.id,
        book: serializeBookMetadata(doc.offeredBookSnapshot.book),
        condition: doc.offeredBookSnapshot.condition,
      }
    : null;

  return {
    id: String(doc._id),
    listingId,
    owner: overrides?.owner ?? extractMember(doc.owner),
    requester: overrides?.requester ?? extractMember(doc.requester),
    listing: {
      id: doc.listingSummary.id || listingId,
      title: doc.listingSummary.title,
      author: doc.listingSummary.author,
      coverUrl: doc.listingSummary.coverUrl ?? null,
      modality: doc.quotedModality,
      status: currentStatus,
    },
    offeredBookId: doc.offeredBook ? extractId(doc.offeredBook) : null,
    offeredBook: offeredBookSnapshot,
    status: doc.status,
    rejectionReason: doc.status === "Rejected" ? doc.rejectionReason : null,
    quotedModality: doc.quotedModality,
    quotedTerms: serializeTerms(doc.quotedTerms),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const RequestModel =
  (mongoose.models.Request as mongoose.Model<RequestDocument> | undefined) ??
  mongoose.model<RequestDocument>("Request", requestSchema);

