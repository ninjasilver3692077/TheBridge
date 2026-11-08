import mongoose, { Schema } from "mongoose";
import type { Role } from "@/types";

export const ROLES: readonly Role[] = ["Member", "Admin"];

export interface AccountDocument {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const accountSchema = new Schema<AccountDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      validate: {
        validator: (value: string) => emailPattern.test(value),
        message: "invalid email address.",
      },
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: "Member" },
  },
  { timestamps: true },
);

accountSchema.index({ email: 1 }, { unique: true });

export const AccountModel =
  (mongoose.models.Account as mongoose.Model<AccountDocument> | undefined) ??
  mongoose.model<AccountDocument>("Account", accountSchema);

export const Account = AccountModel;

