import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { createPasswordResetToken, hashResetToken, parseForgotPasswordInput, parseResetPasswordInput, passwordResetLifetimeMs } from "../server/passwordReset.js";
import { passwordResetLink, resetMail } from "../server/resetMail.js";
import { validateResetPasswordFields } from "../src/services/auth.js";

const originalEnvironment = { ...process.env };
afterEach(() => {
  mock.restoreAll();
  for (const key of ["APP_URL", "MAIL_FROM", "RESEND_API_KEY"]) {
    if (originalEnvironment[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnvironment[key];
  }
});

test("reset tokens use independent random 256-bit secrets and expire in one hour", () => {
  const now = Date.now();
  const first = createPasswordResetToken(now);
  const second = createPasswordResetToken(now);
  assert.match(first.token, /^[a-f0-9]{64}$/);
  assert.notEqual(first.token, second.token);
  assert.notEqual(first.hash, first.token);
  assert.equal(first.hash, hashResetToken(first.token));
  assert.equal(first.expiresAt.getTime(), now + passwordResetLifetimeMs);
});

test("recovery input normalizes emails and rejects unknown fields and invalid passwords", () => {
  assert.deepEqual(parseForgotPasswordInput({ email: " Person@Example.edu " }), { email: "person@example.edu" });
  assert.throws(() => parseForgotPasswordInput({ email: { $ne: "" } }));
  assert.throws(() => parseForgotPasswordInput({ email: "person@example.edu", role: "Admin" }));
  assert.throws(() => parseResetPasswordInput({ token: "bad", newPassword: "a-valid-password" }));
  assert.throws(() => parseResetPasswordInput({ token: "a".repeat(64), newPassword: "short" }), /newPassword:/);
  assert.throws(() => parseResetPasswordInput({ token: "a".repeat(64), newPassword: "é".repeat(37) }), /72 bytes/);
  assert.equal(parseResetPasswordInput({ token: "a".repeat(64), newPassword: "é".repeat(36) }).newPassword.length, 36);
  assert.deepEqual(validateResetPasswordFields({ newPassword: "valid-password", confirmPassword: "different" }), { confirmPassword: "Passwords do not match." });
});

test("reset links trust only APP_URL, preserve a base path and keep secrets in the fragment", () => {
  process.env.APP_URL = "https://preview.example.invalid/thebridge/";
  const url = new URL(passwordResetLink("a".repeat(64)));
  assert.equal(url.pathname, "/thebridge/reset-password");
  assert.equal(url.search, "");
  assert.equal(new URLSearchParams(url.hash.slice(1)).get("token"), "a".repeat(64));
  for (const invalid of ["http://example.invalid", "https://user:pass@example.invalid", "https://example.invalid/?redirect=bad", "https://example.invalid/#bad"]) {
    process.env.APP_URL = invalid;
    assert.throws(() => passwordResetLink("a".repeat(64)));
  }
  process.env.APP_URL = "http://localhost:5173";
  assert.equal(new URL(passwordResetLink("a")).protocol, "http:");
});

test("email delivery calls the HTTP provider with the configured sender and a plain-text reset link", async () => {
  process.env.APP_URL = "https://preview.example.invalid";
  process.env.MAIL_FROM = "TheBridge <reset@example.invalid>";
  process.env.RESEND_API_KEY = "test-key";
  let payload: { from: string; to: string[]; text: string } | undefined;
  mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(options.method, "POST");
    assert.equal((options.headers as Record<string, string>).Authorization, "Bearer test-key");
    assert.ok(options.signal);
    payload = JSON.parse(String(options.body));
    return new Response(JSON.stringify({ id: "test-delivery" }), { status: 200 });
  });
  await resetMail.send({ to: "person@example.edu", token: "a".repeat(64) });
  assert.equal(payload?.from, process.env.MAIL_FROM);
  assert.deepEqual(payload?.to, ["person@example.edu"]);
  assert.ok(payload?.text.includes(passwordResetLink("a".repeat(64))));
});

test("email delivery rejects missing config, provider errors and transport failures", async () => {
  delete process.env.RESEND_API_KEY;
  await assert.rejects(resetMail.send({ to: "person@example.edu", token: "a" }), /not configured/);
  process.env.RESEND_API_KEY = "test-key";
  process.env.MAIL_FROM = "reset@example.invalid";
  process.env.APP_URL = "https://preview.example.invalid";
  const transport = mock.method(globalThis, "fetch", async () => new Response("private provider detail", { status: 403 }));
  await assert.rejects(resetMail.send({ to: "person@example.edu", token: "a" }), /^Error: Password reset email could not be sent\.$/);
  transport.mock.mockImplementation(async () => { throw new Error("network down"); });
  await assert.rejects(resetMail.send({ to: "person@example.edu", token: "a" }));
});
