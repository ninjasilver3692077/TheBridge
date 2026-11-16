import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import AuthCard from "../components/auth/AuthCard.jsx";
import AuthField from "../components/auth/AuthField.jsx";
import { useAuthForm } from "../hooks/useAuthForm.js";
import { forgotPassword, validateEmailFields } from "../services/auth.js";
import { buttonPrimaryLg, textLink } from "../styles/ui.js";

function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const { values, errors, formError, isSubmitting, updateField, handleSubmit } = useAuthForm({
    initialValues: { email: "" },
    validate: validateEmailFields,
    submit: forgotPassword,
    onSuccess: (result) => setMessage(result.message),
  });

  return (
    <AppShell title="Password recovery" subtitle="Recover access to your account">
      <AuthCard
        eyebrowText="Account recovery"
        heading="Forgot your password?"
        lead="Enter your account email to request a link. The link expires in one hour."
      >
        {message ? (
          <p role="status" className="mt-6 text-sm text-ink">{message}</p>
        ) : (
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
            <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{formError}</p>
            <button type="submit" disabled={isSubmitting} className={"w-full " + buttonPrimaryLg}>
              {isSubmitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm"><Link to="/login" className={textLink}>Back to sign in</Link></p>
      </AuthCard>
    </AppShell>
  );
}

export default ForgotPasswordPage;
