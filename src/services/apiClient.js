import {
  expireSession,
  isSessionExpired,
  readSession,
  readSessionGeneration,
} from "./authStorage.js";

export const sessionExpiredEvent = "thebridge:session-expired";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class StaleSessionError extends Error {
  constructor() {
    super("The session changed while the request was running.");
  }
}

function expireActiveSession() {
  expireSession();
  window.dispatchEvent(new Event(sessionExpiredEvent));
}

async function readErrorMessage(response) {
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}

export async function apiRequest(path, { method = "GET", body, authenticated = false, signal } = {}) {
  const headers = { Accept: "application/json" };
  const generation = readSessionGeneration();
  const session = readSession();

  if (authenticated) {
    if (isSessionExpired(session)) {
      expireActiveSession();
      throw new ApiError(401, "Your session expired. Please log in again.");
    }
    headers.Authorization = `Bearer ${session.token}`;
  }
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError(0, "We could not reach TheBridge. Check your connection and try again.");
  }

  if (authenticated && generation !== readSessionGeneration()) throw new StaleSessionError();

  if (!response.ok) {
    const message = await readErrorMessage(response);
    if (authenticated && response.status === 401) expireActiveSession();
    throw new ApiError(response.status, message);
  }

  return response.json();
}
