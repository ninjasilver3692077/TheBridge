import { Link, useLocation } from "react-router-dom";
import { navigationItems } from "../data/navigation.js";
import { focusRing } from "../styles/ui.js";
import NavIcon from "./navigation/NavIcon.jsx";

const mobileItems = navigationItems.filter((item) => item.mobile);

function BottomNavigation() {
  const location = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-chrome/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
      aria-label="Mobile navigation"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {mobileItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <li key={item.id}>
              <Link
                to={item.path}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] transition-colors ${focusRing} ${
                  isActive
                    ? "bg-wine-soft font-semibold text-wine-ink dark:text-ink"
                    : "font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
                }`}
              >
                <NavIcon name={item.icon} />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default BottomNavigation;
