import { Link, useLocation } from "react-router-dom";
import { navigationItems } from "../../data/navigation.js";
import { focusRing } from "../../styles/ui.js";
import NavIcon from "./NavIcon.jsx";

function SidebarNavigation({ collapsed }) {
  const location = useLocation();

  const isCurrentRoute = (item) => {
    if (item.path === "/") {
      return location.pathname === "/";
    }

    return location.pathname === item.path;
  };

  return (
    <nav className="mt-8 flex-1 overflow-y-auto" aria-label="TheBridge sections">
      <ul className="space-y-1">
        {navigationItems.map((item) => {
          const isActive = isCurrentRoute(item);

          return (
            <li key={item.id}>
              <Link
                to={item.path}
                aria-current={isActive ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={`flex items-center rounded-xl px-3 py-2.5 text-[15px] transition-colors ${focusRing} ${
                  collapsed ? "justify-center" : "gap-3"
                } ${
                  isActive
                    ? "bg-wine-soft font-semibold text-wine-ink dark:text-ink"
                    : "font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
                }`}
              >
                <NavIcon name={item.icon} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default SidebarNavigation;
