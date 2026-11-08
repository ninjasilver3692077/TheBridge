import mongoose from "mongoose";
import type { ClientSession, HydratedDocument, Types } from "mongoose";
import type { EditBookInput } from "@/types";
import { LibraryBookModel } from "../models/LibraryBook.js";
import type { LibraryBookDocument } from "../models/LibraryBook.js";
import { ListingModel } from "../models/Listing.js";
import { HttpError } from "./errors.js";
import { assertNoOffer, requestLinks } from "./requestLinks.js";
import type { listingInput } from "./marketplaceInput.js";

type ListingInput = ReturnType<typeof listingInput>;

async function lockCopy(id: string | Types.ObjectId, owner: string, session: ClientSession): Promise<HydratedDocument<LibraryBookDocument>> {
  const copy = await LibraryBookModel.findOne({ _id: id, owner }).session(session).exec();
  if (!copy) throw new HttpError(404, "Library book not found.");
  if (copy.status !== "Available") throw new HttpError(409, "Only Available copies can be changed.");
  const guard = await LibraryBookModel.updateOne({ _id: copy._id, owner, status: "Available", deletedAt: null }, { $inc: { revision: 1 } }, { session }).exec();
  if (guard.matchedCount !== 1) throw new HttpError(409, "Copy is no longer available.");
  await assertNoOffer(copy._id, session);
  const open = await ListingModel.exists({ libraryBook: copy._id, status: { $in: ["Available", "Reserved"] } }).session(session);
  if (open) throw new HttpError(409, "Copy already has an open listing.");
  return copy;
}

export async function changeCopy(id: string, owner: string, input: EditBookInput | null) {
  return mongoose.connection.transaction(async (session) => {
    const copy = await lockCopy(id, owner, session);
    if (input === null) {
      await LibraryBookModel.updateOne({ _id: copy._id, deletedAt: null }, { $set: { deletedAt: new Date() } }, { session }).exec();
      return null;
    }
    if (input.condition !== undefined) copy.condition = input.condition;
    if (input.notes !== undefined) copy.notes = input.notes;
    await copy.save({ session });
    return copy;
  });
}

export async function publishListing(owner: string, input: ListingInput) {
  const copyId = input.libraryBookId;
  if (!copyId) throw new HttpError(400, "libraryBookId: required field.");
  return mongoose.connection.transaction(async (session) => {
    const copy = await lockCopy(copyId, owner, session);
    const [listing] = await ListingModel.create([{
      libraryBook: copy._id, owner: copy.owner, book: copy.book,
      condition: copy.condition, description: copy.notes,
      modality: input.modality, terms: input.terms, status: "Available",
    }], { session });
    if (!listing) throw new HttpError(500, "Unexpected server error.");
    copy.status = "Published";
    await copy.save({ session });
    return listing;
  });
}

export async function changeListing(id: string, owner: string, input: ListingInput | null) {
  return mongoose.connection.transaction(async (session) => {
    const listing = await ListingModel.findById(id).session(session).exec();
    if (!listing || listing.status === "Removed") throw new HttpError(404, "Listing not found.");
    if (String(listing.owner) !== owner) throw new HttpError(403, "Only the owner can change this listing.");
    if (listing.status !== "Available") throw new HttpError(409, "Only Available listings can be changed.");
    const guard = await ListingModel.updateOne({ _id: listing._id, status: "Available" }, { $inc: { revision: 1 } }, { session }).exec();
    if (guard.matchedCount !== 1) throw new HttpError(409, "Listing is no longer available.");
    if (input) {
      const pending = await requestLinks().findOne({ listing: listing._id, status: "Pending" }, { session });
      if (pending) throw new HttpError(409, "A listing with Pending requests cannot be edited.");
      listing.modality = input.modality;
      listing.terms = input.terms;
    } else {
      const copy = await LibraryBookModel.findOne({ _id: listing.libraryBook, owner, status: "Published" }).session(session).exec();
      if (!copy) throw new HttpError(409, "Published copy is no longer available.");
      const copyGuard = await LibraryBookModel.updateOne({ _id: copy._id, owner, status: "Published", deletedAt: null }, { $inc: { revision: 1 }, $set: { status: "Available" } }, { session }).exec();
      if (copyGuard.matchedCount !== 1) throw new HttpError(409, "Copy is no longer available.");
      listing.status = "Closed";
      listing.closureReason = "Withdrawn";
      await requestLinks().updateMany({ listing: listing._id, status: "Pending" }, { $set: {
        status: "Rejected", rejectionReason: "ListingWithdrawn", "listingSummary.status": "Closed", updatedAt: new Date(),
      } }, { session });
    }
    await listing.save({ session });
    return listing;
  });
}
