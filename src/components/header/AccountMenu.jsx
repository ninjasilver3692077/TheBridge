import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../../hooks/useSession.js";
import { logout } from "../../services/auth.js";
import { buttonSecondarySm, focusRing } from "../../styles/ui.js";
import ChangePasswordDialog from "../account/ChangePasswordDialog.jsx";
import DeleteAccountDialog from "../account/DeleteAccountDialog.jsx";

const actionButtonClass = `h-9 rounded-xl px-2.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink sm:px-3 sm:text-sm ${focusRing}`;

function AccountMenu() {
  const session = useSession();
  const navigate = useNavigate();
  const [activeDialog, setActiveDialog] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  if (!session) {
    return (
      <Link to="/login" className={buttonSecondarySm}>
        Sign in
      </Link>
    );
  }

  const { name, role } = session.account;

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handlePasswordUpdated = (message) => {
    setActiveDialog(null);
    setStatusMessage(message);
  };

  const handleAccountDeleted = () => {
    setActiveDialog(null);
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-1.5">
      <span className="flex h-10 items-center gap-2 px-1.5">
        <span className="sr-only">{`Signed in as ${name}, ${role}`}</span>
        <span
          className="grid h-8 w-8 place-items-center rounded-full bg-wine-soft text-xs font-bold text-wine-ink"
          aria-hidden="true"
        >
          {name.charAt(0).toUpperCase()}
        </span>

        <span className="hidden flex-col leading-tight md:flex" aria-hidden="true">
          <span className="max-w-32 truncate text-sm font-semibold text-ink">{name}</span>
          <span className="text-xs text-ink-muted">{role}</span>
        </span>
      </span>

      <button
        type="button"
        onClick={() => {
          setStatusMessage("");
          setActiveDialog("password");
        }}
        className={actionButtonClass}
      >
        Change password
      </button>

      {role === "Member" && (
        <button
          type="button"
          onClick={() => {
            setStatusMessage("");
            setActiveDialog("delete");
          }}
          className={actionButtonClass}
        >
          Delete account
        </button>
      )}

      <button type="button" onClick={handleLogout} className={actionButtonClass}>
        Sign out
      </button>

      {statusMessage && (
        <span role="status" className="text-xs font-medium text-[#3F5E47] dark:text-[#B8D4BE]">
          {statusMessage}
        </span>
      )}

      {activeDialog === "password" && (
        <ChangePasswordDialog
          onClose={() => setActiveDialog(null)}
          onSuccess={handlePasswordUpdated}
        />
      )}

      {activeDialog === "delete" && (
        <DeleteAccountDialog
          onClose={() => setActiveDialog(null)}
          onDeleted={handleAccountDeleted}
        />
      )}
    </div>
  );
}

export default AccountMenu;
