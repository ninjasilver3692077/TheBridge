import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import AuthCard from "../components/auth/AuthCard.jsx";
import AuthField from "../components/auth/AuthField.jsx";
import { useAuthForm } from "../hooks/useAuthForm.js";
import { login, validateLoginFields } from "../services/auth.js";
import { isExpiryNoticeVisible, sessionExpiredMessage } from "../services/authStorage.js";
import { buttonPrimaryLg, textLink } from "../styles/ui.js";

function LoginPage() {
  const location = useLocation();
  const [showExpiryNotice] = useState(isExpiryNoticeVisible);
  const { values, errors, formError, isSubmitting, updateField, handleSubmit } =
    useAuthForm({
      initialValues: { email: "", password: "" },
      validate: validateLoginFields,
      submit: login,
    });

  return (
    <AppShell title="Sign in" subtitle="Access your personal TheBridge space">
      <AuthCard
        eyebrowText="Member access"
        heading="Welcome back"
        lead="Sign in to manage your books, listings and requests."
      >
        {showExpiryNotice && !formError && (
          <p
            role="status"
            className="mt-6 rounded-xl border border-line bg-surface-muted px-4 py-3 text-sm font-medium text-ink"
          >
            {sessionExpiredMessage}
          </p>
        )}

        <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
          <AuthField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={values.email}
            error={errors.email}
            onChange={updateField("email")}
          />

          <AuthField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            error={errors.password}
            onChange={updateField("password")}
          />

          <p aria-live="assertive" className="min-h-0 text-sm font-medium text-rose-700 dark:text-rose-300">
            {formError}
          </p>

          <button type="submit" disabled={isSubmitting} className={`w-full ${buttonPrimaryLg}`}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

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
