import { useCallback, useState } from "react";
import { isSessionExpired } from "../services/authStorage.js";
import { fetchActiveSentListingIds } from "../services/requests.js";
import { useApiResource } from "./useApiResource.js";
import { useAccountId, useSession } from "./useSession.js";

const noRequests = new Set();

export function useListingRequestState(listing) {
  const session = useSession();
  const signedIn = Boolean(session) && !isSessionExpired(session);
  const isMember = signedIn && session.account.role === "Member";
  const accountId = useAccountId();
  const [sent, setSent] = useState({ accountId: null, ids: noRequests });
  const sentIds = sent.accountId === accountId ? sent.ids : noRequests;

  const load = useCallback(
    (signal) =>
      isMember ? fetchActiveSentListingIds({ signal }) : Promise.resolve(noRequests),
    [isMember],
  );
  const { data: activeIds } = useApiResource(load, accountId);

  const markSent = useCallback(
    (listingId) =>
      setSent((current) => ({
        accountId,
        ids: new Set(current.accountId === accountId ? current.ids : []).add(
          listingId,
        ),
      })),
    [accountId],
  );

  return {
    signedIn,
    isMember,
    isOwner: Boolean(listing) && signedIn && session.account.id === listing.ownerId,
    requestSent: Boolean(listing) && (sentIds.has(listing.id) || Boolean(activeIds?.has(listing.id))),
    listingStatus: listing?.status,
    markSent,
  };
}
