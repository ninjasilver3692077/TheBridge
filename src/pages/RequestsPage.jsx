import { useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import RequestList from "../components/requests/RequestList.jsx";
import RequestsHeader from "../components/requests/RequestsHeader.jsx";
import RequestsTabs from "../components/requests/RequestsTabs.jsx";
import { useStoredState } from "../hooks/useStoredState.js";
import { loadMyBooks } from "../services/myBooksStorage.js";
import { getRequestStatusMessage } from "../services/requestStatus.js";
import {
  loadRequests,
  REQUESTS_EVENT,
  updateRequestStatus,
} from "../services/requestsStorage.js";

const requestEvents = [REQUESTS_EVENT];

function RequestsPage() {
  const [activeTab, setActiveTab] = useState("received");
  const requests = useStoredState(loadRequests, requestEvents);
  const [myBooks] = useState(loadMyBooks);
  const [announcement, setAnnouncement] = useState("");

  const myBooksById = useMemo(
    () => new Map(myBooks.map((book) => [book.id, book])),
    [myBooks],
  );

  const counts = useMemo(
    () => ({
      received: requests.filter((request) => request.direction === "received")
        .length,
      sent: requests.filter((request) => request.direction === "sent").length,
    }),
    [requests],
  );

  const visibleRequests = requests.filter(
    (request) => request.direction === activeTab,
  );

  const handleStatusChange = (requestId, status) => {
    const updatedRequest = updateRequestStatus(requestId, status);

    if (updatedRequest) {
      setAnnouncement(getRequestStatusMessage(updatedRequest));
    }
  };

  return (
    <AppShell
      title="Requests"
      subtitle="Manage book requests between members"
    >
      <section>
        <RequestsHeader />

        <div className="mt-8">
          <RequestsTabs
            activeTab={activeTab}
            counts={counts}
            onChange={setActiveTab}
          />
        </div>

        <RequestList
          requests={visibleRequests}
          myBooksById={myBooksById}
          onStatusChange={handleStatusChange}
        />

        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
      </section>
    </AppShell>
  );
}

export default RequestsPage;
