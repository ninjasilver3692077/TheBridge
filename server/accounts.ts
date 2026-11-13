import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Account, AuthSession, LoginInput, RegisterInput, Role } from "@/types";
import type { AccountDocument } from "../models/Account.js";
import { HttpError } from "./errors.js";

export const passwordHashCost = 12;
export const requiredSessionTtlSeconds = 86400;

const minimumSecretBytes = 32;
const minimumPasswordLength = 8;
const maximumPasswordBytes = 72;
const maximumNameLength = 100;
const maximumEmailLength = 254;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rejectedSecrets = new Set(["changeme", "secret", "replace-with-a-random-secret"]);
const invalidCredentialsMessage = "Email or password is incorrect.";
const dummyPasswordSource = "thebridge-dummy-password-for-timing";

export interface AuthConfig {
  secret: string;
  ttlSeconds: number;
}

export interface StoredAccount extends AccountDocument {
  _id: unknown;
}

export function readAuthConfig(): AuthConfig {
  const secret = process.env.JWT_SECRET ?? "";
  if (Buffer.byteLength(secret, "utf8") < minimumSecretBytes || rejectedSecrets.has(secret.toLowerCase())) {
    throw new Error("JWT_SECRET must be a random value of at least 32 bytes.");
  }
  const rawTtl = (process.env.JWT_TTL_SECONDS ?? String(requiredSessionTtlSeconds)).trim();
  const ttlSeconds = /^\d+$/.test(rawTtl) ? Number(rawTtl) : Number.NaN;
  if (ttlSeconds !== requiredSessionTtlSeconds) {
    throw new Error(`JWT_TTL_SECONDS must be ${requiredSessionTtlSeconds}.`);
  }
  return { secret, ttlSeconds };
}

function requireAuthConfig(): AuthConfig {
  try {
    return readAuthConfig();
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Invalid auth configuration.");
    throw new HttpError(500, "Unexpected server error.");
  }
}

export function readObjectBody(body: unknown, allowedFields: readonly string[]): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object.");
  }
  const unknownField = Object.keys(body).find((field) => !allowedFields.includes(field));
  if (unknownField) throw new HttpError(400, `${unknownField}: field is not allowed.`);
  return body as Record<string, unknown>;
}

export function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") throw new HttpError(400, "email: enter an email address.");
  const email = value.trim().toLowerCase();
  if (!email) throw new HttpError(400, "email: enter an email address.");
  if (email.length > maximumEmailLength || !emailPattern.test(email)) {
    throw new HttpError(400, "email: enter a valid email address.");
  }
  return email;
}

export function validateName(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new HttpError(400, "name: enter your name.");
  const name = value.trim();
  if (name.length > maximumNameLength) {
    throw new HttpError(400, `name: use at most ${maximumNameLength} characters.`);
  }
  return name;
}

export function validatePassword(value: unknown): string {
  if (typeof value !== "string" || value.length < minimumPasswordLength) {
    throw new HttpError(400, `password: use at least ${minimumPasswordLength} characters.`);
  }
  if (Buffer.byteLength(value, "utf8") > maximumPasswordBytes) {
    throw new HttpError(400, `password: use at most ${maximumPasswordBytes} bytes.`);
  }
  return value;
}

export function parseRegisterInput(body: unknown): RegisterInput {
  const fields = readObjectBody(body, ["name", "email", "password"]);
  return {
    name: validateName(fields.name),
    email: normalizeEmail(fields.email),
    password: validatePassword(fields.password),
  };
}

export function parseLoginInput(body: unknown): LoginInput {
  const fields = readObjectBody(body, ["email", "password"]);
  const email = normalizeEmail(fields.email);
  if (typeof fields.password !== "string" || !fields.password) {
    throw new HttpError(400, "password: enter your password.");
  }
  return { email, password: fields.password };
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, passwordHashCost);
}

let dummyHash: Promise<string> | undefined;

export async function verifyPassword(password: string, account: StoredAccount | null): Promise<boolean> {
  if (!account) {
    dummyHash ??= bcrypt.hash(dummyPasswordSource, passwordHashCost);
    await bcrypt.compare(password, await dummyHash);
    return false;
  }
  return bcrypt.compare(password, account.passwordHash);
}

export function invalidCredentials(): HttpError {
  return new HttpError(401, invalidCredentialsMessage);
}

export function toAccount(account: StoredAccount): Account {
  return {
    id: String(account._id),
    name: account.name,
    email: account.email,
    role: account.role,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

export function createSession(account: StoredAccount): AuthSession {
  const { secret, ttlSeconds } = requireAuthConfig();
  const role: Role = account.role;
  const token = jwt.sign({ role }, secret, {
    algorithm: "HS256",
    subject: String(account._id),
    expiresIn: ttlSeconds,
  });
  const decoded = jwt.decode(token);
  const expiresAtSeconds =
    typeof decoded === "object" && decoded !== null && typeof decoded.exp === "number"
      ? decoded.exp
      : Math.floor(Date.now() / 1000) + ttlSeconds;
  return {
    token,
    expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
    account: toAccount(account),
  };
}
