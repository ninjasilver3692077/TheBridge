import type { RequestHandler } from "express";
import mongoose from "mongoose";
import { readEnv } from "./env.js";
import { HttpError } from "./errors.js";

const connectedState = 1;

let pendingConnection: Promise<void> | undefined;

export async function connectDatabase(uri: string): Promise<void> {
  if (!uri) throw new Error("MONGODB_URI is not set.");
  if (mongoose.connection.readyState === connectedState) return;
  pendingConnection ??= mongoose
    .connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => undefined)
    .finally(() => {
      pendingConnection = undefined;
    });
  await pendingConnection;
}

export const requireDatabase: RequestHandler = async (_req, _res, next) => {
  try {
    await connectDatabase(readEnv().mongodbUri);
  } catch {
    throw new HttpError(503, "Storage is unavailable. Try again later.");
  }
  next();
};
