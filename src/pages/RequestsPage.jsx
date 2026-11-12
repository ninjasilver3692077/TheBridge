import { useCallback, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import RequestList from "../components/requests/RequestList.jsx";
import RequestsHeader from "../components/requests/RequestsHeader.jsx";
import RequestsTabs from "../components/requests/RequestsTabs.jsx";
import { useApiResource } from "../hooks/useApiResource.js";
import { useAccountId } from "../hooks/useSession.js";
import { changeRequest, fetchRequests } from "../services/requests.js";
import { getRequestStatusMessage } from "../services/requestStatus.js";
import { notice } from "../styles/ui.js";

function RequestsPage() {
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

  return (
    <AppShell
      title="Requests"
      subtitle="Manage book requests between members"
    >
      <section>
        <RequestsHeader />

        {status === "loading" && (
          <div className="mt-8">
            <LoadingState
              title="Loading your requests..."
              message="Fetching the requests you sent and received."
            />
          </div>
        )}

        {status === "error" && (
          <div className="mt-8">
            <ErrorState
              title="We could not load your requests"
              message={error}
              onRetry={reload}
            />
          </div>
        )}

        {status === "success" && (
          <>
            <div className="mt-8">
              <RequestsTabs
                activeTab={activeTab}
                counts={counts}
                onChange={setActiveTab}
              />
            </div>

            {actionError && (
              <p role="alert" className={`mt-4 text-sm ${notice.danger}`}>
                {actionError}
              </p>
            )}

            {visibleRequests.length === 0 ? (
              <p className="mt-6 rounded-2xl bg-surface-muted px-6 py-12 text-center text-sm text-ink-muted">
                {activeTab === "received"
                  ? "You have not received any requests yet."
                  : "You have not sent any requests yet."}
              </p>
            ) : (
              <RequestList
                requests={visibleRequests}
                busyId={busyId}
                onAction={handleAction}
              />
            )}
          </>
        )}

        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
      </section>
    </AppShell>
  );
}

export default RequestsPage;
