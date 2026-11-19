import { badge, tone } from "../../styles/ui.js";

function ActivityNote({ book }) {
  const isPending = book.activityStatus.toLowerCase().includes("pending");

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
      <span className={`${badge} ${isPending ? tone.amber : tone.plum}`}>
        {book.activityStatus}
      </span>
      {book.activityWith && <span>with {book.activityWith}</span>}
    </p>
  );
}

export default ActivityNote;
