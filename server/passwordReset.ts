import { createHash, randomBytes } from "node:crypto";
import { AccountModel } from "../models/Account.js";
import { hashPassword, normalizeEmail, readObjectBody, validatePassword } from "./accounts.js";
import { HttpError } from "./errors.js";
import { resetMail } from "./resetMail.js";

export const passwordResetMessage = "If an account matches that email, you will receive a password reset link.";
export const passwordResetLifetimeMs = 60 * 60 * 1000;
const invalidTokenMessage = "This reset link is invalid or expired. Request a new link.";

export function createPasswordResetToken(now = Date.now()) {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashResetToken(token), expiresAt: new Date(now + passwordResetLifetimeMs) };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function parseForgotPasswordInput(raw: unknown) {
  const body = readObjectBody(raw, ["email"]);
  return { email: normalizeEmail(body.email) };
}

export function parseResetPasswordInput(raw: unknown) {
  const body = readObjectBody(raw, ["token", "newPassword"]);
  if (typeof body.token !== "string" || !/^[a-f0-9]{64}$/.test(body.token)) {
    throw new HttpError(400, invalidTokenMessage);
  }
  try {
    return { token: body.token, newPassword: validatePassword(body.newPassword) };
  } catch (error) {
    if (error instanceof HttpError) throw new HttpError(error.status, error.message.replace(/^password:/, "newPassword:"));
    throw error;
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const reset = createPasswordResetToken();
  const account = await AccountModel.findOneAndUpdate(
    { email },
    { $set: { passwordResetHash: reset.hash, passwordResetExpiresAt: reset.expiresAt } },
  ).select("email").exec();
  if (!account) return;

  try {
    await resetMail.send({ to: account.email, token: reset.token });
  } catch {
    await AccountModel.updateOne(
      { _id: account._id, passwordResetHash: reset.hash },
      { $unset: { passwordResetHash: "", passwordResetExpiresAt: "" } },
    ).exec();
    console.error("Password reset email delivery failed.");
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  const account = await AccountModel.findOneAndUpdate(
    { passwordResetHash: hashResetToken(token), passwordResetExpiresAt: { $gt: new Date() } },
    { $set: { passwordHash }, $unset: { passwordResetHash: "", passwordResetExpiresAt: "" } },
  ).select("_id").exec();
  if (!account) throw new HttpError(400, invalidTokenMessage);
}
