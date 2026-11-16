import { apiRequest } from "./apiClient.js";

export const ADMIN_PAGE_SIZE = 10;
export const REASON_MAX_LENGTH = 500;

function buildQuery({ page, q, status }) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(ADMIN_PAGE_SIZE),
  });

  if (q) params.set("q", q);
  if (status) params.set("status", status);

  return params.toString();
}

function collectionFetcher(path) {
  return async ({ page = 1, q = "", status = "", signal } = {}) => {
    const { data, meta } = await apiRequest(
      `${path}?${buildQuery({ page, q, status })}`,
      { authenticated: true, signal },
    );

    return { items: data, meta };
  };
}

export const fetchAdminListings = collectionFetcher("/admin/listings");
export const fetchAdminRequests = collectionFetcher("/admin/requests");
export const fetchAdminMembers = collectionFetcher("/admin/members");

export async function fetchAdminOverview({ signal } = {}) {
  const { data } = await apiRequest("/admin/overview", {
    authenticated: true,
    signal,
  });

  return data;
}

export async function removeAdminListing(listingId, reason) {
  const { data } = await apiRequest(`/admin/listings/${listingId}`, {
    method: "DELETE",
    authenticated: true,
    body: { reason: reason.trim() },
  });

  return data;
}

export async function deleteAdminMember(memberId) {
  const { data } = await apiRequest(`/admin/accounts/${encodeURIComponent(memberId)}`, {
    method: "DELETE",
    authenticated: true,
  });

  return data;
}
