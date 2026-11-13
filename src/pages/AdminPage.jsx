import { useCallback, useState } from "react";
import AdminCollection from "../components/admin/AdminCollection.jsx";
import AdminOverview from "../components/admin/AdminOverview.jsx";
import {
  AdminListingRow,
  AdminMemberRow,
  AdminRequestRow,
} from "../components/admin/AdminRows.jsx";
import AdminTabs from "../components/admin/AdminTabs.jsx";
import DeleteMemberDialog from "../components/admin/DeleteMemberDialog.jsx";
import RemoveListingDialog from "../components/admin/RemoveListingDialog.jsx";
import AppShell from "../components/AppShell.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { useApiResource } from "../hooks/useApiResource.js";
import { useSession } from "../hooks/useSession.js";
import {
  fetchAdminListings,
  fetchAdminMembers,
  fetchAdminOverview,
  fetchAdminRequests,
} from "../services/admin.js";
import { eyebrow, pageLead, pageTitle } from "../styles/ui.js";

const TABS = ["Listings", "Requests", "Members"];
const LISTING_STATUSES = ["Available", "Reserved", "Closed", "Removed"];
const REQUEST_STATUSES = ["Pending", "Accepted", "Rejected", "Cancelled", "Completed"];

function AdminPage() {
  const session = useSession();
  const [activeTab, setActiveTab] = useState("Listings");
  const [removing, setRemoving] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const loadOverview = useCallback((signal) => fetchAdminOverview({ signal }), []);
  const {
    status: overviewStatus,
    data: overview,
    error: overviewError,
    reload: reloadOverview,
  } = useApiResource(loadOverview);

  const handleRemoved = () => {
    setAnnouncement(`${removing.book.title} was removed.`);
    setRemoving(null);
    setReloadKey((key) => key + 1);
    reloadOverview();
  };

  const handleMemberDeleted = () => {
    setAnnouncement(`${deletingMember.name} was deleted.`);
    setDeletingMember(null);
    setReloadKey((key) => key + 1);
    reloadOverview();
  };

  return (
    <AppShell title="Admin Area" subtitle="Moderate TheBridge community activity">
      <section className="max-w-3xl">
        <p className={eyebrow}>Admin Area</p>

        <h1 className={`mt-3 ${pageTitle}`}>
          Welcome, {session?.account.name ?? "Admin"}
        </h1>

        <p className={`mt-4 ${pageLead}`}>
          Review community activity and remove listings that break the rules.
        </p>
      </section>

      {overviewStatus === "loading" && (
        <div className="mt-8">
          <LoadingState
            title="Loading the overview..."
            message="Counting members, listings and requests."
          />
        </div>
      )}

      {overviewStatus === "error" && (
        <div className="mt-8">
          <ErrorState
            title="We could not load the overview"
            message={overviewError}
            onRetry={reloadOverview}
          />
        </div>
      )}

      {overviewStatus === "success" && <AdminOverview overview={overview} />}

      <AdminTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "Listings" && (
        <AdminCollection
          key="Listings"
          label="Listings"
          fetchPage={fetchAdminListings}
          statuses={LISTING_STATUSES}
          columns={["Book", "Owner", "Modality", "Status", "Updated", ""]}
          emptyText="No listings match your search."
          reloadKey={reloadKey}
          renderRow={(listing) => (
            <AdminListingRow key={listing.id} listing={listing} onRemove={setRemoving} />
          )}
        />
      )}

      {activeTab === "Requests" && (
        <AdminCollection
          key="Requests"
          label="Requests"
          fetchPage={fetchAdminRequests}
          statuses={REQUEST_STATUSES}
          columns={["Book", "Owner", "Requester", "Modality", "Status", "Updated"]}
          emptyText="No requests match your search."
          reloadKey={reloadKey}
          renderRow={(request) => <AdminRequestRow key={request.id} request={request} />}
        />
      )}

      {activeTab === "Members" && (
        <AdminCollection
          key="Members"
          label="Members"
          fetchPage={fetchAdminMembers}
          columns={["Name", "Email", "Joined", ""]}
          emptyText="No members match your search."
          reloadKey={reloadKey}
          renderRow={(member) => (
            <AdminMemberRow
              key={member.id}
              member={member}
              onDelete={setDeletingMember}
            />
          )}
        />
      )}

      {removing && (
        <RemoveListingDialog
          listing={removing}
          onClose={() => setRemoving(null)}
          onRemoved={handleRemoved}
        />
      )}

      {deletingMember && (
        <DeleteMemberDialog
          member={deletingMember}
          onClose={() => setDeletingMember(null)}
          onDeleted={handleMemberDeleted}
        />
      )}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </AppShell>
  );
}

export default AdminPage;
