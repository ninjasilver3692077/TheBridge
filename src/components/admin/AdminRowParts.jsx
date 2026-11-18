import { badge, tone } from "../../styles/ui.js";

const statusTone = {
  Available: tone.sage,
  Accepted: tone.sage,
  Completed: tone.sage,
  Pending: tone.amber,
  Reserved: tone.amber,
  Removed: tone.rose,
  Rejected: tone.rose,
  Cancelled: tone.rose,
  Closed: tone.plum,
};

export function StatusBadge({ status }) {
  return <span className={`${badge} ${statusTone[status]}`}>{status}</span>;
}

export function Person({ name, email }) {
  return (
    <>
      <p className="font-medium text-ink">{name}</p>
      <p className="text-xs text-ink-muted">{email}</p>
    </>
  );
}
