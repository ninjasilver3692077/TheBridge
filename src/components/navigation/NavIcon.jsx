import { fallbackNavIconPath, navIconPaths } from "./navIconPaths.jsx";

function NavIcon({ name }) {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden={true}
    >
      {Object.hasOwn(navIconPaths, name) ? navIconPaths[name] : fallbackNavIconPath}
    </svg>
  );
}

export default NavIcon;
