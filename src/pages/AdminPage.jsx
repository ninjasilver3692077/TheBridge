import { useState } from "react";
import AdminOverviewSection from "../components/admin/AdminOverviewSection.jsx";
import AdminTabPanels from "../components/admin/AdminTabPanels.jsx";
import AdminTabs from "../components/admin/AdminTabs.jsx";
import DeleteMemberDialog from "../components/admin/DeleteMemberDialog.jsx";
import RemoveListingDialog from "../components/admin/RemoveListingDialog.jsx";
import AppShell from "../components/AppShell.jsx";
import { useAdminModeration } from "../hooks/useAdminModeration.js";
import { useAdminOverview } from "../hooks/useAdminOverview.js";
import { useSession } from "../hooks/useSession.js";
import { eyebrow, pageLead, pageTitle } from "../styles/ui.js";

const TABS = ["Listings", "Requests", "Members"];

function AdminPage() {
  const session = useSession();
  const [activeTab, setActiveTab] = useState("Listings");
  const {
    status: overviewStatus,
    data: overview,
    error: overviewError,
    reload: reloadOverview,
  } = useAdminOverview();
  const moderation = useAdminModeration(reloadOverview);

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

      <AdminOverviewSection
        status={overviewStatus}
        overview={overview}
        error={overviewError}
        onRetry={reloadOverview}
      />

      <AdminTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <AdminTabPanels
        activeTab={activeTab}
        reloadKey={moderation.reloadKey}
        onRemoveListing={moderation.setRemoving}
        onDeleteMember={moderation.setDeletingMember}
      />

      {moderation.removing && (
        <RemoveListingDialog
          listing={moderation.removing}
          onClose={() => moderation.setRemoving(null)}
          onRemoved={moderation.handleRemoved}
        />
      )}

      {moderation.deletingMember && (
        <DeleteMemberDialog
          member={moderation.deletingMember}
          onClose={() => moderation.setDeletingMember(null)}
          onDeleted={moderation.handleMemberDeleted}
        />
      )}

      <p className="sr-only" aria-live="polite">
        {moderation.announcement}
      </p>
    </AppShell>
  );
}

export default AdminPage;
