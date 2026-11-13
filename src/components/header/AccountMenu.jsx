import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../../hooks/useSession.js";
import { logout } from "../../services/auth.js";
import { buttonSecondarySm, focusRing } from "../../styles/ui.js";
import ChangePasswordDialog from "../account/ChangePasswordDialog.jsx";
import DeleteAccountDialog from "../account/DeleteAccountDialog.jsx";

const menuItemClass = `h-10 w-full rounded-lg px-3 text-left text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink ${focusRing}`;

function AccountMenu() {
  const session = useSession();
  const navigate = useNavigate();
  const [activeDialog, setActiveDialog] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnOutsidePress = (event) => {
      if (!containerRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  if (!session) {
    return (
      <Link to="/login" className={buttonSecondarySm}>
        Sign in
      </Link>
    );
  }

  const { name, role } = session.account;

  const handleLogout = () => {
    setMenuOpen(false);
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

  const openDialog = (dialog) => {
    setStatusMessage("");
    setMenuOpen(false);
    setActiveDialog(dialog);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`Account menu, signed in as ${name}, ${role}`}
        className={`flex h-10 items-center gap-2 rounded-xl px-1.5 transition-colors hover:bg-surface-muted ${focusRing}`}
      >
        <span
          className="grid h-8 w-8 place-items-center rounded-full bg-wine-soft text-xs font-bold text-wine-ink"
          aria-hidden="true"
        >
          {name.charAt(0).toUpperCase()}
        </span>

        <span className="hidden flex-col text-left leading-tight md:flex" aria-hidden="true">
          <span className="max-w-32 truncate text-sm font-semibold text-ink">{name}</span>
          <span className="text-xs text-ink-muted">{role}</span>
        </span>
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 flex w-52 max-w-[calc(100vw-2rem)] flex-col gap-0.5 rounded-xl border border-line bg-surface p-1.5 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => openDialog("password")}
            className={menuItemClass}
          >
            Change password
          </button>

          {role === "Member" && (
            <button
              type="button"
              role="menuitem"
              onClick={() => openDialog("delete")}
              className={menuItemClass}
            >
              Delete account
            </button>
          )}

          <button type="button" role="menuitem" onClick={handleLogout} className={menuItemClass}>
            Sign out
          </button>
        </div>
      )}

      {statusMessage && (
        <p
          role="status"
          className="absolute right-0 top-full z-40 mt-2 w-max max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface px-3 py-2 text-xs font-medium text-[#3F5E47] shadow-lg dark:text-[#B8D4BE]"
        >
          {statusMessage}
        </p>
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
