import { useAuthForm } from "../../hooks/useAuthForm.js";
import { login, validateLoginFields } from "../../services/auth.js";
import { buttonPrimaryLg } from "../../styles/ui.js";
import AuthField from "./AuthField.jsx";

function LoginForm({ showExpiryNotice, expiryMessage }) {
  const { values, errors, formError, isSubmitting, updateField, handleSubmit } =
    useAuthForm({
      initialValues: { email: "", password: "" },
      validate: validateLoginFields,
      submit: login,
    });

  return (
    <>
      {showExpiryNotice && !formError && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-line bg-surface-muted px-4 py-3 text-sm font-medium text-ink"
        >
          {expiryMessage}
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
    </>
  );
}

export default LoginForm;
