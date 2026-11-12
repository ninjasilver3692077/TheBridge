import { card } from "../../styles/ui.js";

function CountGroup({ title, counts }) {
  return (
    <div className={`p-5 ${card}`}>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {Object.entries(counts).map(([name, count]) => (
          <div key={name} className="flex items-baseline justify-between gap-2">
            <dt className="text-ink-muted">{name}</dt>
            <dd className="font-semibold text-ink">{count}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function AdminOverview({ overview }) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      <div className={`p-5 ${card}`}>
        <h3 className="text-sm font-semibold text-ink">Members</h3>
        <p className="mt-3 text-3xl font-bold text-ink">{overview.memberCount}</p>
      </div>

      <CountGroup title="Listings by status" counts={overview.listingsByStatus} />
      <CountGroup title="Requests by status" counts={overview.requestsByStatus} />
    </div>
  );
}

export default AdminOverview;
