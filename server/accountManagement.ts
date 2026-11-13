import mongoose from "mongoose";
import type { Account, ChangePasswordInput, DeleteAccountInput } from "@/types";
import { AccountModel } from "../models/Account.js";
import { FavoriteModel } from "../models/Favorite.js";
import { LibraryBookModel } from "../models/LibraryBook.js";
import { ListingModel } from "../models/Listing.js";
import { RequestModel } from "../models/Request.js";
import {
  hashPassword,
  readObjectBody,
  toAccount,
  validatePassword,
  verifyPassword,
} from "./accounts.js";
import type { StoredAccount } from "./accounts.js";
import { HttpError } from "./errors.js";

const wrongCurrentPasswordMessage = "Current password is incorrect.";
const wrongDeletePasswordMessage = "Password is incorrect.";
const activeCommitmentMessage =
  "Complete active accepted requests and book returns before deleting this account.";

export function parseChangePasswordInput(raw: unknown): ChangePasswordInput {
  const fields = readObjectBody(raw, ["currentPassword", "newPassword"]);
  if (typeof fields.currentPassword !== "string" || !fields.currentPassword) {
    throw new HttpError(400, "currentPassword: enter your current password.");
  }
  try {
    return {
      currentPassword: fields.currentPassword,
      newPassword: validatePassword(fields.newPassword),
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw new HttpError(error.status, error.message.replace(/^password:/, "newPassword:"));
    }
    throw error;
  }
}

export function parseDeleteAccountInput(raw: unknown): DeleteAccountInput {
  const fields = readObjectBody(raw, ["password"]);
  if (typeof fields.password !== "string" || !fields.password) {
    throw new HttpError(400, "password: enter your password.");
  }
  return { password: fields.password };
}

export async function changeAccountPassword(
  accountId: string,
  input: ChangePasswordInput,
): Promise<Account> {
  const account = await AccountModel.findById(accountId).select("+passwordHash").exec();
  if (!account) {
    throw new HttpError(401, "Invalid or expired session.");
  }

  const passwordMatches = await verifyPassword(
    input.currentPassword,
    account.toObject() as StoredAccount,
  );
  if (!passwordMatches) {
    throw new HttpError(401, wrongCurrentPasswordMessage);
  }

  account.passwordHash = await hashPassword(input.newPassword);
  await account.save();
  return toAccount(account.toObject() as StoredAccount);
}

async function deleteMemberAccountInTransaction(
  targetId: string,
  missingStatus: 401 | 404,
): Promise<{ id: string; deleted: true }> {
  await mongoose.connection.transaction(async (session) => {
    const account = await AccountModel.findById(targetId).session(session).exec();
    if (!account) {
      throw new HttpError(
        missingStatus,
        missingStatus === 401 ? "Invalid or expired session." : "Account not found.",
      );
    }
    if (account.role !== "Member") {
      throw new HttpError(403, "Admin accounts cannot be deleted.");
    }

    const acceptedRequest = await RequestModel.findOne({
      status: "Accepted",
      $or: [{ owner: account._id }, { requester: account._id }],
    })
      .select("_id")
      .session(session)
      .exec();
    if (acceptedRequest) {
      throw new HttpError(409, activeCommitmentMessage);
    }

    const activeCopy = await LibraryBookModel.findOne({
      owner: account._id,
      status: { $nin: ["Available", "Published", "Transferred"] },
    })
      .select("_id")
      .session(session)
      .exec();
    if (activeCopy) {
      throw new HttpError(409, activeCommitmentMessage);
    }

    const now = new Date();

    await RequestModel.updateMany(
      { owner: account._id, status: "Pending" },
      {
        $set: {
          status: "Rejected",
          rejectionReason: "AccountDeleted",
          "listingSummary.status": "Closed",
          updatedAt: now,
        },
      },
      { session },
    ).exec();

    await RequestModel.updateMany(
      { requester: account._id, status: "Pending" },
      {
        $set: {
          status: "Rejected",
          rejectionReason: "AccountDeleted",
          updatedAt: now,
        },
      },
      { session },
    ).exec();

    await RequestModel.updateMany(
      { owner: account._id, status: { $ne: "Pending" }, "listingSummary.status": "Available" },
      {
        $set: {
          "listingSummary.status": "Closed",
          updatedAt: now,
        },
      },
      { session },
    ).exec();

    await ListingModel.deleteMany({ owner: account._id }, { session }).exec();
    await LibraryBookModel.deleteMany({ owner: account._id }, { session }).exec();
    await FavoriteModel.deleteMany({ owner: account._id }, { session }).exec();

    const deleted = await AccountModel.deleteOne(
      { _id: account._id, role: "Member" },
      { session },
    ).exec();
    if (deleted.deletedCount !== 1) {
      throw new HttpError(409, "Account changed. Refresh before trying again.");
    }
  });

  return { id: targetId, deleted: true };
}

export async function deleteOwnAccount(
  accountId: string,
  input: DeleteAccountInput,
): Promise<{ id: string; deleted: true }> {
  const account = await AccountModel.findById(accountId)
    .select("+passwordHash")
    .lean<StoredAccount>()
    .exec();
  if (!account) {
    throw new HttpError(401, "Invalid or expired session.");
  }

  const passwordMatches = await verifyPassword(input.password, account);
  if (!passwordMatches) {
    throw new HttpError(401, wrongDeletePasswordMessage);
  }

  return deleteMemberAccountInTransaction(accountId, 401);
}

export async function deleteAccountByAdmin(
  targetId: string,
  adminId: string,
): Promise<{ id: string; deleted: true }> {
  if (targetId === adminId) {
    throw new HttpError(403, "Admin accounts cannot be deleted.");
  }

  return deleteMemberAccountInTransaction(targetId, 404);
}
