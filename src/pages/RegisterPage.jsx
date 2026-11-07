import { Link, useLocation } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import AuthCard from "../components/auth/AuthCard.jsx";
import AuthField from "../components/auth/AuthField.jsx";
import { useAuthForm } from "../hooks/useAuthForm.js";
import { register, validateRegisterFields } from "../services/auth.js";
import { buttonPrimaryLg, textLink } from "../styles/ui.js";

function RegisterPage() {
  const location = useLocation();
  const { values, errors, formError, isSubmitting, updateField, handleSubmit } =
    useAuthForm({
      initialValues: { name: "", email: "", password: "" },
      validate: validateRegisterFields,
      submit: register,
    });

  return (
    <AppShell title="Create account" subtitle="Join your campus book community">
      <AuthCard
        eyebrowText="New member"
        heading="Create your account"
        lead="Share the books you own and find the ones you need."
      >
        <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
          <AuthField
            id="name"
            label="Name"
            autoComplete="name"
            value={values.name}
            error={errors.name}
            onChange={updateField("name")}
          />

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
            autoComplete="new-password"
            value={values.password}
            error={errors.password}
            hint="At least 8 characters."
            onChange={updateField("password")}
          />

          <p aria-live="assertive" className="text-sm font-medium text-rose-700 dark:text-rose-300">
            {formError}
          </p>

          <button type="submit" disabled={isSubmitting} className={`w-full ${buttonPrimaryLg}`}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link to="/login" state={location.state} className={textLink}>
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AppShell>
  );
}

export default RegisterPage;
