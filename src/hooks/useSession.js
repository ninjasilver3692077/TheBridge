import { useEffect, useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { sessionExpiredEvent } from "../services/apiClient.js";
import {
  expireSession,
  isSessionExpired,
  millisecondsUntilExpiry,
  readSession,
  subscribeToSession,
} from "../services/authStorage.js";

const maximumTimerDelay = 2147483647;

export function useSession() {
  return useSyncExternalStore(subscribeToSession, readSession, () => null);
}

export function useSessionExpiryObserver() {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = `${location.pathname}${location.search}`;

  useEffect(() => {
    const redirectToLogin = () => {
      if (location.pathname === "/login") return;
      navigate("/login", { replace: true, state: { from: currentPath } });
    };

    const checkExpiry = () => {
      const active = readSession();
      if (active && isSessionExpired(active)) {
        expireSession();
        redirectToLogin();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkExpiry();
    };

    checkExpiry();
    window.addEventListener("focus", checkExpiry);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener(sessionExpiredEvent, redirectToLogin);

    const timer = session
      ? window.setTimeout(checkExpiry, Math.min(Math.max(millisecondsUntilExpiry(session), 0) + 250, maximumTimerDelay))
      : undefined;

    return () => {
      window.removeEventListener("focus", checkExpiry);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener(sessionExpiredEvent, redirectToLogin);
      window.clearTimeout(timer);
    };
  }, [session, navigate, currentPath, location.pathname]);
}
