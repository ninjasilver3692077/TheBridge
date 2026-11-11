import mongoose from "mongoose";
import type { ClientSession, Types } from "mongoose";
import type { RequestStatus } from "@/types";
import { HttpError } from "./errors.js";

export interface RequestLink {
  listing: Types.ObjectId;
  offeredBook: Types.ObjectId | null;
  owner: Types.ObjectId;
  requester: Types.ObjectId;
  status: RequestStatus;
  rejectionReason?: string | null;
  listingSummary?: { status: string };
  updatedAt: Date;
}

export function requestLinks() {
  const db = mongoose.connection.db;
  if (!db) throw new HttpError(503, "Storage is unavailable. Try again later.");
  return db.collection<RequestLink>("requests");
}

export async function assertNoOffer(copyId: Types.ObjectId, session: ClientSession): Promise<void> {
  const active = await requestLinks().findOne({ offeredBook: copyId, status: { $in: ["Pending", "Accepted"] } }, { session });
  if (active) throw new HttpError(409, "This copy is offered in an active request.");
}
