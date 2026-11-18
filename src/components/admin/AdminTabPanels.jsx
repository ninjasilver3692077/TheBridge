import {
  fetchAdminListings,
  fetchAdminMembers,
  fetchAdminRequests,
} from "../../services/admin.js";
import AdminCollection from "./AdminCollection.jsx";
import AdminListingRow from "./AdminListingRow.jsx";
import AdminMemberRow from "./AdminMemberRow.jsx";
import AdminRequestRow from "./AdminRequestRow.jsx";

const LISTING_STATUSES = ["Available", "Reserved", "Closed", "Removed"];
const REQUEST_STATUSES = ["Pending", "Accepted", "Rejected", "Cancelled", "Completed"];

function AdminTabPanels({ activeTab, reloadKey, onRemoveListing, onDeleteMember }) {
  if (activeTab === "Listings") {
    return (
      <AdminCollection
        key="Listings"
        label="Listings"
        fetchPage={fetchAdminListings}
        statuses={LISTING_STATUSES}
        columns={["Book", "Owner", "Modality", "Status", "Updated", ""]}
        emptyText="No listings match your search."
        reloadKey={reloadKey}
        renderRow={(listing) => (
          <AdminListingRow
            key={listing.id}
            listing={listing}
            onRemove={onRemoveListing}
          />
        )}
      />
    );
  }

  if (activeTab === "Requests") {
    return (
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
    );
  }

  return (
    <AdminCollection
      key="Members"
      label="Members"
      fetchPage={fetchAdminMembers}
      columns={["Name", "Email", "Joined", ""]}
      emptyText="No members match your search."
      reloadKey={reloadKey}
      renderRow={(member) => (
        <AdminMemberRow key={member.id} member={member} onDelete={onDeleteMember} />
      )}
    />
  );
}

export default AdminTabPanels;
