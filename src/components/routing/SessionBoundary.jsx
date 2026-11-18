import { Outlet } from "react-router-dom";
import { useSessionExpiryObserver } from "../../hooks/useSession.js";

function SessionBoundary() {
  useSessionExpiryObserver();

  return <Outlet />;
}

export default SessionBoundary;
