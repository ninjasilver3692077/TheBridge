import { Router } from "express";
import type { RequestHandler } from "express";
import type { AuthSession, DataResponse, Account as AccountDto } from "@/types";
import { AccountModel } from "../models/Account.js";
import {
  createSession,
  hashPassword,
  invalidCredentials,
  parseLoginInput,
  parseRegisterInput,
  toAccount,
  verifyPassword,
} from "../server/accounts.js";
import type { StoredAccount } from "../server/accounts.js";
import { currentAccount, requireAuth } from "../server/auth.js";
import { requireDatabase } from "../server/db.js";
import { HttpError, methodNotAllowed } from "../server/errors.js";

export const authRouter = Router();

const duplicateEmailMessage = "An account with this email already exists.";

const preventCaching: RequestHandler = (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
};

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

const register: RequestHandler = async (req, res) => {
  const input = parseRegisterInput(req.body);
  const existing = await AccountModel.exists({ email: input.email }).exec();
  if (existing) throw new HttpError(409, duplicateEmailMessage);

  const passwordHash = await hashPassword(input.password);
  let created: StoredAccount;
  try {
    const document = await AccountModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: "Member",
    });
    created = document.toObject();
  } catch (error) {
    if (isDuplicateKeyError(error)) throw new HttpError(409, duplicateEmailMessage);
    throw error;
  }

  const body: DataResponse<AuthSession> = { data: createSession(created) };
  res.status(201).json(body);
};

const login: RequestHandler = async (req, res) => {
  const input = parseLoginInput(req.body);
  const account = await AccountModel.findOne({ email: input.email })
    .select("+passwordHash")
    .lean<StoredAccount>()
    .exec();

  const passwordMatches = await verifyPassword(input.password, account);
  if (!account || !passwordMatches) throw invalidCredentials();

  const body: DataResponse<AuthSession> = { data: createSession(account) };
  res.json(body);
};

const readOwnAccount: RequestHandler = async (_req, res) => {
  const { id } = currentAccount(res);
  const account = await AccountModel.findById(id).lean<StoredAccount>().exec();
  if (!account) throw new HttpError(401, "Invalid or expired session.");

  const body: DataResponse<AccountDto> = { data: toAccount(account) };
  res.json(body);
};

authRouter
  .route("/auth/register")
  .post(preventCaching, requireDatabase, register)
  .all(methodNotAllowed(["POST"]));

authRouter
  .route("/auth/login")
  .post(preventCaching, requireDatabase, login)
  .all(methodNotAllowed(["POST"]));

authRouter
  .route("/auth/me")
  .get(preventCaching, requireDatabase, requireAuth, readOwnAccount)
  .all(methodNotAllowed(["GET", "HEAD"]));
