import { useCallback, useState } from "react";
import { isSessionExpired } from "../services/authStorage.js";
import { fetchActiveSentListingIds } from "../services/requests.js";
import { useApiResource } from "./useApiResource.js";
import { useSession } from "./useSession.js";

const noRequests = new Set();

export function useListingRequestState(listing) {
  const session = useSession();
  const signedIn = Boolean(session) && !isSessionExpired(session);
  const isMember = signedIn && session.account.role === "Member";
  const [sentIds, setSentIds] = useState(noRequests);

  const load = useCallback(
    (signal) =>
      isMember ? fetchActiveSentListingIds({ signal }) : Promise.resolve(noRequests),
    [isMember],
  );
  const { data: activeIds } = useApiResource(load);

  const markSent = useCallback(
    (listingId) => setSentIds((current) => new Set(current).add(listingId)),
    [],
  );

  return {
    signedIn,
    isMember,
    isOwner: Boolean(listing) && signedIn && session.account.id === listing.ownerId,
    requestSent: Boolean(listing) && (sentIds.has(listing.id) || Boolean(activeIds?.has(listing.id))),
    markSent,
  };
}
