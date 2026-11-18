import { useRef } from "react";
import { Link } from "react-router-dom";
import { useAccountMenu } from "../../hooks/useAccountMenu.js";
import { useSession } from "../../hooks/useSession.js";
import { buttonSecondarySm } from "../../styles/ui.js";
import ChangePasswordDialog from "../account/ChangePasswordDialog.jsx";
import DeleteAccountDialog from "../account/DeleteAccountDialog.jsx";
import AccountMenuItems from "./AccountMenuItems.jsx";
import AccountMenuTrigger from "./AccountMenuTrigger.jsx";

function AccountMenu() {
  const session = useSession();
  const containerRef = useRef(null);
  const menu = useAccountMenu(containerRef);

  if (!session) {
    return (
      <Link to="/login" className={buttonSecondarySm}>
        Sign in
      </Link>
    );
  }

  const { name, role } = session.account;

  return (
    <div ref={containerRef} className="relative">
      <AccountMenuTrigger name={name} role={role} menuOpen={menu.menuOpen} onToggle={menu.toggleMenu} />

      {menu.menuOpen && (
        <AccountMenuItems role={role} onOpenDialog={menu.openDialog} onLogout={menu.handleLogout} />
      )}

      {menu.statusMessage && (
        <p
          role="status"
          className="absolute right-0 top-full z-40 mt-2 w-max max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface px-3 py-2 text-xs font-medium text-[#3F5E47] shadow-lg dark:text-[#B8D4BE]"
        >
          {menu.statusMessage}
        </p>
      )}

      {menu.activeDialog === "password" && (
        <ChangePasswordDialog onClose={menu.closeDialog} onSuccess={menu.handlePasswordUpdated} />
      )}

      {menu.activeDialog === "delete" && (
        <DeleteAccountDialog onClose={menu.closeDialog} onDeleted={menu.handleAccountDeleted} />
      )}
    </div>
  );
}

export default AccountMenu;
