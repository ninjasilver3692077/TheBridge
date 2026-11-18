import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../../hooks/useSession.js";
import { safeReturnPath } from "../../services/auth.js";
import { isSessionExpired } from "../../services/authStorage.js";

function GuestOnlyRoute() {
  const session = useSession();
  const location = useLocation();

  if (!isSessionExpired(session)) {
    return (
      <Navigate
        to={safeReturnPath(location.state?.from, session.account.role)}
        replace
      />
    );
  }

  return <Outlet />;
}

export default GuestOnlyRoute;
