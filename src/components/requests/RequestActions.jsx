import { buttonPrimarySm, buttonSecondarySm } from "../../styles/ui.js";

function RequestActions({ actions, busy, onAction }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {actions.map(({ action, label, primary }) => (
        <button
          key={action}
          type="button"
          disabled={busy}
          onClick={() => onAction(action)}
          className={primary ? buttonPrimarySm : buttonSecondarySm}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default RequestActions;
