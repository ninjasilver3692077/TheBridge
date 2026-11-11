import mongoose, { Schema } from "mongoose";
import type { Types } from "mongoose";
import type {
  BookMetadata,
  Condition,
  ListingClosureReason,
  ListingStatus,
  ListingTerms,
  Modality,
} from "@/types";
import { bookMetadataSchema } from "../server/bookMetadata.js";
import {
  areValidTermsForModality,
  CONDITIONS,
  LISTING_STATUSES,
  listingTermsSchema,
  MODALITIES,
} from "../server/listingTerms.js";

export const CLOSURE_REASONS: readonly ListingClosureReason[] = ["Withdrawn", "Completed"];

export interface StoredListingModeration {
  reason: string;
  removedAt: Date;
  removedBy: Types.ObjectId;
}

export interface ListingDocument {
  libraryBook: Types.ObjectId;
  owner: Types.ObjectId;
  book: BookMetadata;
  condition: Condition;
  description: string;
  modality: Modality;
  terms: ListingTerms;
  status: ListingStatus;
  closureReason: ListingClosureReason | null;
  moderation: StoredListingModeration | null;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

const listingModerationSchema = new Schema<StoredListingModeration>(
  {
    reason: { type: String, required: true, trim: true, minlength: 1, maxlength: 500 },
    removedAt: { type: Date, required: true },
    removedBy: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  },
  { _id: false },
);

const listingSchema = new Schema<ListingDocument>(
  {
    libraryBook: { type: Schema.Types.ObjectId, ref: "LibraryBook", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    book: { type: bookMetadataSchema, required: true },
    condition: { type: String, enum: CONDITIONS, required: true },
    description: { type: String, default: "", maxlength: 2000 },
    modality: { type: String, enum: MODALITIES, required: true },
    terms: {
      type: listingTermsSchema,
      required: true,
      validate: {
        validator: function (value: ListingTerms) {
          const doc = this as unknown as Partial<ListingDocument>;
          return Boolean(doc.modality && value && areValidTermsForModality(doc.modality, value));
        },
        message: "terms do not match modality.",
      },
    },
    status: {
      type: String,
      enum: LISTING_STATUSES,
      required: true,
      default: "Available",
    },
    closureReason: {
      type: String,
      default: null,
      validate: {
        validator: (value: string | null) =>
          value === null || CLOSURE_REASONS.includes(value as ListingClosureReason),
        message: "invalid closure reason.",
      },
    },
    moderation: { type: listingModerationSchema, default: null },
    revision: { type: Number, default: 0, select: false },
  },
  { timestamps: true },
);

listingSchema.index(
  { libraryBook: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["Available", "Reserved"] } } },
);
listingSchema.index({ status: 1, createdAt: -1, _id: -1 });
listingSchema.index({ owner: 1, createdAt: -1, _id: -1 });

export const ListingModel =
  (mongoose.models.Listing as mongoose.Model<ListingDocument> | undefined) ??
  mongoose.model<ListingDocument>("Listing", listingSchema);

export const Listing = ListingModel;
