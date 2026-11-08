import mongoose, { Schema } from "mongoose";
import type { Types } from "mongoose";
import type { BookMetadata, Condition, LibraryBookStatus } from "@/types";
import { bookMetadataSchema } from "../server/bookMetadata.js";
import { CONDITIONS } from "../server/listingTerms.js";

export const LIBRARY_BOOK_STATUSES: readonly LibraryBookStatus[] = [
  "Available",
  "Published",
  "Reserved",
  "Lent",
  "Transferred",
];

export interface StoredModerationNote {
  listingId: Types.ObjectId;
  reason: string;
  removedAt: Date;
}

export interface LibraryBookDocument {
  owner: Types.ObjectId;
  book: BookMetadata;
  condition: Condition;
  notes: string;
  status: LibraryBookStatus;
  lastModeration: StoredModerationNote | null;
  revision: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const moderationNoteSchema = new Schema<StoredModerationNote>(
  {
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    reason: { type: String, required: true, trim: true, minlength: 1, maxlength: 500 },
    removedAt: { type: Date, required: true },
  },
  { _id: false },
);

const libraryBookSchema = new Schema<LibraryBookDocument>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    book: { type: bookMetadataSchema, required: true },
    condition: { type: String, enum: CONDITIONS, required: true },
    notes: { type: String, default: "", maxlength: 2000 },
    status: {
      type: String,
      enum: LIBRARY_BOOK_STATUSES,
      required: true,
      default: "Available",
    },
    lastModeration: { type: moderationNoteSchema, default: null },
    revision: { type: Number, default: 0, select: false },
    deletedAt: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

libraryBookSchema.pre("find", function () { this.where({ deletedAt: null }); });
libraryBookSchema.pre("findOne", function () { this.where({ deletedAt: null }); });
libraryBookSchema.pre("countDocuments", function () { this.where({ deletedAt: null }); });

libraryBookSchema.index({ owner: 1, createdAt: -1, _id: -1 });

export const LibraryBookModel =
  (mongoose.models.LibraryBook as mongoose.Model<LibraryBookDocument> | undefined) ??
  mongoose.model<LibraryBookDocument>("LibraryBook", libraryBookSchema);

export const LibraryBook = LibraryBookModel;
