import { badge, buttonGhost, modalityTone } from "../../styles/ui.js";
import { formatAdminDate } from "./formatAdminDate.js";
import { Person, StatusBadge } from "./AdminRowParts.jsx";

const removableStatuses = ["Available", "Reserved"];

function AdminListingRow({ listing, onRemove }) {
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
      <td className="px-4 py-3 text-ink-muted">{formatAdminDate(listing.updatedAt)}</td>
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

export default AdminListingRow;
