import mongoose from "mongoose";

let connection: Promise<typeof mongoose> | undefined;

export function connectDatabase(uri: string): Promise<typeof mongoose> {
  if (!uri) return Promise.reject(new Error("MONGODB_URI is not set."));
  connection ??= mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }).catch((error: unknown) => {
    connection = undefined;
    throw error;
  });
  return connection;
}
