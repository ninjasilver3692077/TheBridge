import { badge, buttonGhost, modalityTone, tone } from "../../styles/ui.js";

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

const removableStatuses = ["Available", "Reserved"];

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString("en-US", { dateStyle: "medium" });
}

function StatusBadge({ status }) {
  return <span className={`${badge} ${statusTone[status]}`}>{status}</span>;
}

function Person({ name, email }) {
  return (
    <>
      <p className="font-medium text-ink">{name}</p>
      <p className="text-xs text-ink-muted">{email}</p>
    </>
  );
}

export function AdminListingRow({ listing, onRemove }) {
  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-medium text-ink">{listing.book.title}</p>
        <p className="text-xs text-ink-muted">{listing.book.author}</p>
      </td>
      <td className="px-4 py-3">
        <Person name={listing.owner.name} email={listing.ownerEmail} />
      </td>
      <td className="px-4 py-3">
        <span className={`${badge} ${modalityTone[listing.modality]}`}>
          {listing.modality}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={listing.status} />
        {listing.moderation && (
          <p className="mt-1 max-w-48 text-xs text-ink-muted">
            “{listing.moderation.reason}” by {listing.moderation.removedBy.name}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-ink-muted">{formatDate(listing.updatedAt)}</td>
      <td className="px-4 py-3 text-right">
        {removableStatuses.includes(listing.status) && (
          <button
            type="button"
            onClick={() => onRemove(listing)}
            aria-label={`Remove ${listing.book.title}`}
            className={buttonGhost}
          >
            Remove
          </button>
        )}
      </td>
    </tr>
  );
}

export function AdminRequestRow({ request }) {
  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-medium text-ink">{request.listing.title}</p>
        <p className="text-xs text-ink-muted">{request.listing.author}</p>
      </td>
      <td className="px-4 py-3">
        <Person name={request.owner.name} email={request.ownerEmail} />
      </td>
      <td className="px-4 py-3">
        <Person name={request.requester.name} email={request.requesterEmail} />
      </td>
      <td className="px-4 py-3">
        <span className={`${badge} ${modalityTone[request.quotedModality]}`}>
          {request.quotedModality}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={request.status} />
      </td>
      <td className="px-4 py-3 text-ink-muted">{formatDate(request.updatedAt)}</td>
    </tr>
  );
}

export function AdminMemberRow({ member }) {
  return (
    <tr>
      <td className="px-4 py-3 font-medium text-ink">{member.name}</td>
      <td className="px-4 py-3 text-ink-muted">{member.email}</td>
      <td className="px-4 py-3 text-ink-muted">{formatDate(member.createdAt)}</td>
    </tr>
  );
}
