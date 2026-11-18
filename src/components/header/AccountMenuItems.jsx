import { focusRing } from "../../styles/ui.js";

const menuItemClass = `h-10 w-full rounded-lg px-3 text-left text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink ${focusRing}`;

function AccountMenuItems({ role, onOpenDialog, onLogout }) {
  return (
    <div
      role="menu"
      className="absolute right-0 top-full z-50 mt-2 flex w-52 max-w-[calc(100vw-2rem)] flex-col gap-0.5 rounded-xl border border-line bg-surface p-1.5 shadow-lg"
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => onOpenDialog("password")}
        className={menuItemClass}
      >
        Change password
      </button>

      {role === "Member" && (
        <button
          type="button"
          role="menuitem"
          onClick={() => onOpenDialog("delete")}
          className={menuItemClass}
        >
          Delete account
        </button>
      )}

      <button type="button" role="menuitem" onClick={onLogout} className={menuItemClass}>
        Sign out
      </button>
    </div>
  );
}

export default AccountMenuItems;
