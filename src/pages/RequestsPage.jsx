import AppShell from "../components/AppShell.jsx";
import RequestsContent from "../components/requests/RequestsContent.jsx";
import RequestsHeader from "../components/requests/RequestsHeader.jsx";
import { useRequests } from "../hooks/useRequests.js";

function RequestsPage() {
  const requests = useRequests();

  return (
    <AppShell title="Requests" subtitle="Manage book requests between members">
      <section>
        <RequestsHeader />
        <RequestsContent requests={requests} />
        <p className="sr-only" aria-live="polite">
          {requests.announcement}
        </p>
      </section>
    </AppShell>
  );
}

export default RequestsPage;
