import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../../hooks/useSession.js";
import { homePathByRole } from "../../services/auth.js";
import { isSessionExpired } from "../../services/authStorage.js";

function ProtectedRoute({ role }) {
  const session = useSession();
  const location = useLocation();

  if (isSessionExpired(session)) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (session.account.role !== role) {
    return <Navigate to={homePathByRole[session.account.role]} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
