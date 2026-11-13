import { apiRequest } from "./apiClient.js";
import { clearSession, saveSession } from "./authStorage.js";

const minimumPasswordLength = 8;
const maximumPasswordBytes = 72;
const maximumNameLength = 100;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const homePathByRole = { Member: "/my-books", Admin: "/admin" };

export function validateEmailFields({ email }) {
  const errors = {};
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!emailPattern.test(email.trim())) errors.email = "Enter a valid email address.";
  return errors;
}

export function validateLoginFields({ email, password }) {
  const errors = validateEmailFields({ email });
  if (!password) errors.password = "Enter your password.";
  return errors;
}

function passwordError(password) {
  if (!password) return "Enter your password.";
  if (password.length < minimumPasswordLength) return "Use at least 8 characters.";
  if (new TextEncoder().encode(password).length > maximumPasswordBytes) return "Use a shorter password (72 bytes maximum).";
  return "";
}

export function validateResetPasswordFields({ newPassword, confirmPassword }) {
  const errors = {};
  const message = passwordError(newPassword);
  if (message) errors.newPassword = message;
  if (newPassword !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
  return errors;
}

export function validateRegisterFields({ name, email, password }) {
  const errors = validateLoginFields({ email, password });
  if (!name.trim()) errors.name = "Enter your name.";
  else if (name.trim().length > maximumNameLength) errors.name = "Use at most 100 characters.";
  const message = passwordError(password);
  if (message) errors.password = message;
  return errors;
}

export function fieldFromServerMessage(message) {
  const match = /^(name|email|password|newPassword): (.+)$/.exec(message);
  if (!match) return null;
  const [, field, detail] = match;
  return { field, message: detail.charAt(0).toUpperCase() + detail.slice(1) };
}

export async function login({ email, password }) {
  const { data } = await apiRequest("/auth/login", {
    method: "POST",
    body: { email: email.trim(), password },
  });
  saveSession(data);
  return data;
}

export async function register({ name, email, password }) {
  const { data } = await apiRequest("/auth/register", {
    method: "POST",
    body: { name: name.trim(), email: email.trim(), password },
  });
  saveSession(data);
  return data;
}

export async function forgotPassword({ email }) {
  const { data } = await apiRequest("/auth/forgot-password", {
    method: "POST",
    body: { email: email.trim() },
  });
  return data;
}

export async function resetPassword({ token, newPassword }) {
  const { data } = await apiRequest("/auth/reset-password", {
    method: "POST",
    body: { token, newPassword },
  });
  clearSession();
  return data;
}

export async function fetchCurrentAccount(signal) {
  const { data } = await apiRequest("/auth/me", { authenticated: true, signal });
  return data;
}

export function logout() {
  clearSession();
}

export function safeReturnPath(candidate, role) {
  const homePath = homePathByRole[role] ?? "/";
  if (typeof candidate !== "string" || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return homePath;
  }
  if (candidate.startsWith("/login") || candidate.startsWith("/register")) return homePath;
  const adminOnly = candidate.startsWith("/admin");
  if (role === "Admin" && !adminOnly) return homePath;
  if (role === "Member" && adminOnly) return homePath;
  return candidate;
}
