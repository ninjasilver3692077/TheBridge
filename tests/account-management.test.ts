import assert from "node:assert/strict";
import { test } from "node:test";
import { REJECTION_REASONS, RequestModel } from "../models/Request.js";
import {
  parseChangePasswordInput,
  parseDeleteAccountInput,
} from "../server/accountManagement.js";
import { HttpError } from "../server/errors.js";
import { validateChangePasswordFields } from "../src/services/auth.js";
import { getRequestStatusMessage } from "../src/services/requestStatus.js";

test("REJECTION_REASONS and RequestModel accept AccountDeleted", async () => {
  assert.equal(REJECTION_REASONS.includes("AccountDeleted"), true);
  const doc = new RequestModel({
    listing: "507f1f77bcf86cd799439011",
    owner: "507f1f77bcf86cd799439012",
    requester: "507f1f77bcf86cd799439013",
    offeredBook: null,
    offeredBookSnapshot: null,
    listingSummary: {
      id: "507f1f77bcf86cd799439011",
      title: "Dune",
      author: "Frank Herbert",
      coverUrl: null,
      modality: "Loan",
      status: "Closed",
    },
    status: "Rejected",
    rejectionReason: "AccountDeleted",
    quotedModality: "Loan",
    quotedTerms: { desiredBook: null, priceCop: null, durationDays: 14 },
  });
  await doc.validate();
});

test("parseChangePasswordInput enforces registration password rules on newPassword", () => {
  const valid = parseChangePasswordInput({
    currentPassword: "old-password",
    newPassword: "new-valid-password",
  });
  assert.deepEqual(valid, {
    currentPassword: "old-password",
    newPassword: "new-valid-password",
  });

  const invalidCases: [unknown, string][] = [
    [null, "Request body must be a JSON object."],
    [{ currentPassword: "", newPassword: "new-valid-password" }, "currentPassword: enter your current password."],
    [{ currentPassword: "old-password", newPassword: "short" }, "newPassword: use at least 8 characters."],
    [
      { currentPassword: "old-password", newPassword: "x".repeat(73) },
      "newPassword: use at most 72 bytes.",
    ],
    [
      { currentPassword: "old-password", newPassword: "new-valid-password", role: "Admin" },
      "role: field is not allowed.",
    ],
  ];

  for (const [input, expectedMessage] of invalidCases) {
    assert.throws(
      () => parseChangePasswordInput(input),
      (error: unknown) =>
        error instanceof HttpError &&
        error.status === 400 &&
        error.message === expectedMessage,
    );
  }
});

test("parseDeleteAccountInput requires password and rejects extra fields", () => {
  assert.deepEqual(parseDeleteAccountInput({ password: "secret-password" }), {
    password: "secret-password",
  });

  for (const [input, expectedMessage] of [
    [{}, "password: enter your password."],
    [{ password: "" }, "password: enter your password."],
    [{ password: "secret-password", confirm: true }, "confirm: field is not allowed."],
  ] as const) {
    assert.throws(
      () => parseDeleteAccountInput(input),
      (error: unknown) =>
        error instanceof HttpError &&
        error.status === 400 &&
        error.message === expectedMessage,
    );
  }
});

test("client validation and status message helpers handle password change and AccountDeleted", () => {
  assert.deepEqual(
    validateChangePasswordFields({
      currentPassword: "old-password",
      newPassword: "new-password-123",
      confirmPassword: "new-password-123",
    }),
    {},
  );
  assert.equal(
    validateChangePasswordFields({
      currentPassword: "old-password",
      newPassword: "new-password-123",
      confirmPassword: "different-password",
    }).confirmPassword,
    "Passwords do not match.",
  );
  assert.equal(
    getRequestStatusMessage({
      status: "Rejected",
      rejectionReason: "AccountDeleted",
      direction: "sent",
      counterpart: "Member",
    }),
    "The other member's account was deleted, so this request was closed.",
  );
});
