import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import AuthCard from "../components/auth/AuthCard.jsx";
import AuthField from "../components/auth/AuthField.jsx";
import { useAuthForm } from "../hooks/useAuthForm.js";
import { resetPassword, validateResetPasswordFields } from "../services/auth.js";
import { buttonPrimaryLg, textLink } from "../styles/ui.js";

function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(location.hash.slice(1)).get("token") ?? "");
  const [message, setMessage] = useState("");
  const validToken = /^[a-f0-9]{64}$/.test(token);
  const { values, errors, formError, isSubmitting, updateField, handleSubmit } = useAuthForm({
    initialValues: { newPassword: "", confirmPassword: "" },
    validate: validateResetPasswordFields,
    submit: (fields) => resetPassword({ token, newPassword: fields.newPassword }),
    onSuccess: (result) => setMessage(result.message),
  });

  useEffect(() => {
    if (location.hash) navigate(location.pathname, { replace: true });
  }, [location.hash, location.pathname, navigate]);

  return (
    <AppShell title="Reset password" subtitle="Choose a new password">
      <AuthCard
        eyebrowText="Account recovery"
        heading="Reset your password"
        lead="Use at least 8 characters, up to 72 bytes."
      >
        {!validToken && <p role="alert" className="mt-6 text-sm text-rose-700 dark:text-rose-300">This reset link is invalid. Request a new link.</p>}
        {message && <p role="status" className="mt-6 text-sm text-ink">{message}</p>}
        {validToken && !message && (
          <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
            <AuthField
              id="newPassword"
              label="New password"
              type="password"
              autoComplete="new-password"
              value={values.newPassword}
              error={errors.newPassword}
              onChange={updateField("newPassword")}
            />
            <AuthField
              id="confirmPassword"
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              error={errors.confirmPassword}
              onChange={updateField("confirmPassword")}
            />
            <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{formError}</p>
            <button type="submit" disabled={isSubmitting} className={"w-full " + buttonPrimaryLg}>
              {isSubmitting ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}
        {!message && <p className="mt-6 text-center text-sm"><Link to="/forgot-password" className={textLink}>Request a new link</Link></p>}
        <p className="mt-6 text-center text-sm"><Link to="/login" className={textLink}>Back to sign in</Link></p>
      </AuthCard>
    </AppShell>
  );
}

export default ResetPasswordPage;
