const sessionStorageKey = "thebridge:session";
const legacyFlagKey = "thebridge:authenticated";
const sessionChangeEvent = "thebridge:session-change";

export const sessionExpiredMessage = "Your session expired. Please log in again.";

let sessionGeneration = 0;
let expiryNoticeVisible = false;
let cachedRaw;
let cachedSession = null;

function isValidSession(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.token === "string" &&
    typeof value.expiresAt === "string" &&
    !Number.isNaN(Date.parse(value.expiresAt)) &&
    typeof value.account === "object" &&
    value.account !== null &&
    (value.account.role === "Member" || value.account.role === "Admin")
  );
}

function readRawSession() {
  try {
    return localStorage.getItem(sessionStorageKey);
  } catch {
    return null;
  }
}

function announceChange() {
  window.dispatchEvent(new Event(sessionChangeEvent));
}

export function readSession() {
  const raw = readRawSession();
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    cachedSession = isValidSession(parsed) ? parsed : null;
  } catch {
    cachedSession = null;
  }
  return cachedSession;
}

export function readSessionGeneration() {
  return sessionGeneration;
}

export function saveSession(session) {
  sessionGeneration += 1;
  expiryNoticeVisible = false;
  try {
    localStorage.setItem(sessionStorageKey, JSON.stringify(session));
    localStorage.removeItem(legacyFlagKey);
  } catch {
    cachedRaw = undefined;
  }
  announceChange();
}

export function clearSession() {
  sessionGeneration += 1;
  expiryNoticeVisible = false;
  try {
    localStorage.removeItem(sessionStorageKey);
    localStorage.removeItem(legacyFlagKey);
  } catch {
    cachedRaw = undefined;
  }
  announceChange();
}

export function expireSession() {
  clearSession();
  expiryNoticeVisible = true;
}

export function isExpiryNoticeVisible() {
  return expiryNoticeVisible;
}

export function millisecondsUntilExpiry(session, now = Date.now()) {
  return session ? Date.parse(session.expiresAt) - now : 0;
}

export function isSessionExpired(session, now = Date.now()) {
  return !session || millisecondsUntilExpiry(session, now) <= 0;
}

export function subscribeToSession(listener) {
  const handleStorage = (event) => {
    if (event.key === null || event.key === sessionStorageKey) listener();
  };
  window.addEventListener(sessionChangeEvent, listener);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(sessionChangeEvent, listener);
    window.removeEventListener("storage", handleStorage);
  };
}
