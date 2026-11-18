import { badge, modalityTone } from "../../styles/ui.js";
import { formatAdminDate } from "./formatAdminDate.js";
import { Person, StatusBadge } from "./AdminRowParts.jsx";

function AdminRequestRow({ request }) {
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
      <td className="px-4 py-3 text-ink-muted">{formatAdminDate(request.updatedAt)}</td>
    </tr>
  );
}

export default AdminRequestRow;
