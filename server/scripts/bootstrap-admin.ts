import mongoose from "mongoose";
import { AccountModel } from "../../models/Account.js";
import { hashPassword, normalizeEmail, validateName, validatePassword } from "../accounts.js";
import { connectDatabase } from "../db.js";
import { HttpError } from "../errors.js";
import { readEnv } from "../env.js";

export type BootstrapOutcome = "created" | "already-admin";

export interface AdminCredentials {
  name: string;
  email: string;
  password: string;
}

export function readAdminCredentials(environment: NodeJS.ProcessEnv): AdminCredentials {
  return {
    name: validateName(environment.ADMIN_NAME),
    email: normalizeEmail(environment.ADMIN_EMAIL),
    password: validatePassword(environment.ADMIN_PASSWORD),
  };
}

export async function bootstrapAdmin(credentials: AdminCredentials): Promise<BootstrapOutcome> {
  const existing = await AccountModel.findOne({ email: credentials.email }).select("role").lean().exec();
  if (existing) {
    if (existing.role === "Admin") return "already-admin";
    throw new Error("An account with ADMIN_EMAIL already exists as a Member; it is not promoted.");
  }
  await AccountModel.create({
    name: credentials.name,
    email: credentials.email,
    passwordHash: await hashPassword(credentials.password),
    role: "Admin",
  });
  return "created";
}

async function runBootstrap(): Promise<void> {
  const credentials = readAdminCredentials(process.env);
  await connectDatabase(readEnv().mongodbUri);
  await AccountModel.init();
  const outcome = await bootstrapAdmin(credentials);
  console.log(
    outcome === "created"
      ? `Admin account created for ${credentials.email}.`
      : `Admin account for ${credentials.email} already exists; nothing changed.`,
  );
}

runBootstrap()
  .then(() => mongoose.disconnect())
  .catch(async (error: unknown) => {
    const message = error instanceof HttpError || error instanceof Error ? error.message : "Bootstrap failed.";
    console.error(`Admin bootstrap failed: ${message}`);
    process.exitCode = 1;
    await mongoose.disconnect();
  });
