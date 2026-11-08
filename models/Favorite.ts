import mongoose, { Schema } from "mongoose";
import type { HydratedDocument, Types } from "mongoose";
import type { BookMetadata, Favorite as FavoriteDto } from "@/types";
import {
  bookMetadataSchema,
  isPlainObject,
  parseBookMetadataInput,
  serializeBookMetadata,
} from "../server/bookMetadata.js";

export {
  bookMetadataSchema,
  isPlainObject,
  parseBookMetadataInput,
  serializeBookMetadata,
};

export interface FavoriteDocument {
  owner: Types.ObjectId;
  book: BookMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<FavoriteDocument>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    book: { type: bookMetadataSchema, required: true },
  },
  { timestamps: true },
);

favoriteSchema.index({ owner: 1, "book.catalogId": 1 }, { unique: true });
favoriteSchema.index({ owner: 1, createdAt: -1, _id: -1 });

export function toFavoriteDto(doc: HydratedDocument<FavoriteDocument>): FavoriteDto {
  return {
    id: String(doc._id),
    book: serializeBookMetadata(doc.book),
    createdAt: doc.createdAt.toISOString(),
  };
}

export const FavoriteModel =
  (mongoose.models.Favorite as mongoose.Model<FavoriteDocument> | undefined) ??
  mongoose.model<FavoriteDocument>("Favorite", favoriteSchema);

export const Favorite = FavoriteModel;
