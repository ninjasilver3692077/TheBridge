import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import AuthCard from "../components/auth/AuthCard.jsx";
import LoginForm from "../components/auth/LoginForm.jsx";
import { isExpiryNoticeVisible, sessionExpiredMessage } from "../services/authStorage.js";
import { textLink } from "../styles/ui.js";

function LoginPage() {
  const location = useLocation();
  const [showExpiryNotice] = useState(isExpiryNoticeVisible);

  return (
    <AppShell title="Sign in" subtitle="Access your personal TheBridge space">
      <AuthCard
        eyebrowText="Member access"
        heading="Welcome back"
        lead="Sign in to manage your books, listings and requests."
      >
        <LoginForm showExpiryNotice={showExpiryNotice} expiryMessage={sessionExpiredMessage} />

        <p className="mt-5 text-center text-sm">
          <Link to="/forgot-password" className={textLink}>Forgot your password?</Link>
        </p>

        <p className="mt-6 text-center text-sm text-ink-muted">
          New to TheBridge?{" "}
          <Link to="/register" state={location.state} className={textLink}>
            Create an account
          </Link>
        </p>
      </AuthCard>
    </AppShell>
  );
}

export default LoginPage;
