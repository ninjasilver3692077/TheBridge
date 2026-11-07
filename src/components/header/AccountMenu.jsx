import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../../hooks/useSession.js";
import { logout } from "../../services/auth.js";
import { buttonSecondarySm, focusRing } from "../../styles/ui.js";

function AccountMenu() {
  const session = useSession();
  const navigate = useNavigate();

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

  return (
    <div className="flex items-center gap-1 sm:gap-2">
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
        onClick={handleLogout}
        className={`h-9 rounded-xl px-3 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink ${focusRing}`}
      >
        Sign out
      </button>
    </div>
  );
}

export default AccountMenu;
