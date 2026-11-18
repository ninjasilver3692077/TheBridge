import { buttonGhost } from "../../styles/ui.js";
import { formatAdminDate } from "./formatAdminDate.js";

function AdminMemberRow({ member, onDelete }) {
  return (
    <tr>
      <td className="px-4 py-3 font-medium text-ink">{member.name}</td>
      <td className="px-4 py-3 text-ink-muted">{member.email}</td>
      <td className="px-4 py-3 text-ink-muted">{formatAdminDate(member.createdAt)}</td>
      <td className="px-4 py-3 text-right">
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(member)}
            aria-label={`Delete ${member.name}`}
            className={buttonGhost}
          >
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}

export default AdminMemberRow;
