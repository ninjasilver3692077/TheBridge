import type { RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import type { Role } from "@/types";
import { AccountModel } from "../models/Account.js";
import { HttpError } from "./errors.js";

export interface AuthenticatedAccount {
  id: string;
  name: string;
  role: Role;
}

function readJwtSecret(): string {
  const secret = process.env.JWT_SECRET ?? "";
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new HttpError(500, "Unexpected server error.");
  }
  return secret;
}

function extractBearerToken(header: string | undefined): string {
  if (!header) {
    throw new HttpError(401, "Authentication required.");
  }
  const match = /^Bearer\s+(\S+)$/.exec(header.trim());
  if (!match || !match[1]) {
    throw new HttpError(401, "Authentication required.");
  }
  return match[1];
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  const token = extractBearerToken(req.headers.authorization);
  const secret = readJwtSecret();

  let decoded: jwt.JwtPayload;
  try {
    const verified = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (typeof verified !== "object" || verified === null) {
      throw new HttpError(401, "Invalid or expired session.");
    }
    decoded = verified;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, "Invalid or expired session.");
  }

  const subject = decoded.sub;
  if (typeof subject !== "string" || !mongoose.isValidObjectId(subject)) {
    throw new HttpError(401, "Invalid or expired session.");
  }

  const account = await AccountModel.findById(subject).select("name role").exec();
  if (!account) {
    throw new HttpError(401, "Invalid or expired session.");
  }

  res.locals.account = {
    id: String(account._id),
    name: account.name,
    role: account.role,
  } satisfies AuthenticatedAccount;

  next();
};

export function requireRole(...allowedRoles: Role[]): RequestHandler {
  return (_req, res, next) => {
    const account = currentAccount(res);
    if (!allowedRoles.includes(account.role)) {
      next(new HttpError(403, "Forbidden."));
      return;
    }
    next();
  };
}

export function currentAccount(res: Response): AuthenticatedAccount {
  const account = res.locals.account as AuthenticatedAccount | undefined;
  if (!account) {
    throw new HttpError(401, "Authentication required.");
  }
  return account;
}

