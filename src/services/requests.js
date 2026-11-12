import { apiRequest } from "./apiClient.js";
import { readSession } from "./authStorage.js";

const PAGE_LIMIT = 100;
const ACTIVE_STATUSES = ["Pending", "Accepted"];

function describeNote(request, direction, counterpart) {
  const modality = request.quotedModality.toLowerCase();
  const offered = request.offeredBook?.book.title;

  if (direction === "sent") {
    return offered
      ? `Offered ${offered} in exchange for this copy.`
      : `Sent a ${modality} request through TheBridge.`;
  }

  return offered
    ? `${counterpart} offered ${offered} in exchange for this copy.`
    : `${counterpart} sent a ${modality} request for this copy.`;
}

export function toClientRequest(request) {
  const accountId = readSession()?.account.id;
  const direction = request.owner.id === accountId ? "received" : "sent";
  const counterpart = (direction === "received" ? request.requester : request.owner).name;
  const { listing } = request;

  return {
    id: request.id,
    direction,
    listingId: request.listingId,
    counterpart,
    status: request.status,
    rejectionReason: request.rejectionReason,
    note: describeNote(request, direction, counterpart),
    updatedAt: request.updatedAt,
    title: listing.title,
    author: listing.author,
    cover: listing.coverUrl || "",
    modality: request.quotedModality,
    offeredBookTitle: request.offeredBook?.book.title ?? null,
  };
}

async function fetchDirection(direction, signal) {
  const requests = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const { data, meta } = await apiRequest(
      `/requests?direction=${direction}&page=${page}&limit=${PAGE_LIMIT}`,
      { authenticated: true, signal },
    );
    requests.push(...data);
    totalPages = meta.totalPages;
    page += 1;
  }

  return requests;
}

export async function fetchRequests({ signal } = {}) {
  const [received, sent] = await Promise.all([
    fetchDirection("received", signal),
    fetchDirection("sent", signal),
  ]);

  return { received: received.map(toClientRequest), sent: sent.map(toClientRequest) };
}

export async function fetchActiveSentListingIds({ signal } = {}) {
  const sent = await fetchDirection("sent", signal);

  return new Set(
    sent
      .filter((request) => ACTIVE_STATUSES.includes(request.status))
      .map((request) => request.listingId),
  );
}

export async function sendRequest(listingId, offeredBookId) {
  const { data } = await apiRequest(`/listings/${encodeURIComponent(listingId)}/requests`, {
    method: "POST",
    authenticated: true,
    body: offeredBookId ? { offeredBookId } : {},
  });

  return toClientRequest(data);
}

export async function changeRequest(requestId, action) {
  const { data } = await apiRequest(`/requests/${encodeURIComponent(requestId)}/${action}`, {
    method: "PATCH",
    authenticated: true,
    body: {},
  });

  return toClientRequest(data);
}
