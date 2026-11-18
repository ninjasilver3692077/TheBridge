import { focusRing } from "../../styles/ui.js";

function AccountMenuTrigger({ name, role, menuOpen, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
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
  );
}

export default AccountMenuTrigger;
