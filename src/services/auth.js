import { apiRequest } from "./apiClient.js";
import { clearSession, saveSession } from "./authStorage.js";

const minimumPasswordLength = 8;
const maximumPasswordBytes = 72;
const maximumNameLength = 100;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const homePathByRole = { Member: "/my-books", Admin: "/admin" };

export function validateLoginFields({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!emailPattern.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}

export function validateRegisterFields({ name, email, password }) {
  const errors = validateLoginFields({ email, password });
  if (!name.trim()) errors.name = "Enter your name.";
  else if (name.trim().length > maximumNameLength) errors.name = "Use at most 100 characters.";
  if (password && password.length < minimumPasswordLength) {
    errors.password = "Use at least 8 characters.";
  } else if (new TextEncoder().encode(password).length > maximumPasswordBytes) {
    errors.password = "Use a shorter password (72 bytes maximum).";
  }
  return errors;
}

export function fieldFromServerMessage(message) {
  const match = /^(name|email|password): (.+)$/.exec(message);
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
