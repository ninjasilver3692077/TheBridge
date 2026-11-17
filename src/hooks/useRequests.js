import { useCallback, useState } from "react";
import { useApiResource } from "./useApiResource.js";
import { useAccountId } from "./useSession.js";
import { changeRequest, fetchRequests } from "../services/requests.js";
import { getRequestStatusMessage } from "../services/requestStatus.js";

export function useRequests() {
  const [activeTab, setActiveTab] = useState("received");
  const accountId = useAccountId();
  const load = useCallback((signal) => fetchRequests({ signal }), []);
  const { status, data, error, reload } = useApiResource(load, accountId);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const counts = {
    received: data?.received.length ?? 0,
    sent: data?.sent.length ?? 0,
  };
  const visibleRequests = data?.[activeTab] ?? [];

  const handleAction = async (requestId, action) => {
    setBusyId(requestId);
    setActionError("");

    try {
      const updatedRequest = await changeRequest(requestId, action);
      setAnnouncement(getRequestStatusMessage(updatedRequest));
    } catch (actionFailure) {
      setActionError(actionFailure?.message || "We could not update this request.");
    } finally {
      setBusyId(null);
      reload();
    }
  };

  return {
    status,
    error,
    reload,
    activeTab,
    setActiveTab,
    counts,
    visibleRequests,
    busyId,
    actionError,
    announcement,
    handleAction,
  };
}
