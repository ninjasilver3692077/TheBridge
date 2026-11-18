import { notice } from "../../styles/ui.js";
import RequestList from "./RequestList.jsx";
import RequestsTabs from "./RequestsTabs.jsx";

function RequestsResults({ requests }) {
  const {
    activeTab,
    counts,
    setActiveTab,
    actionError,
    visibleRequests,
    busyId,
    handleAction,
  } = requests;

  return (
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
  );
}

export default RequestsResults;
