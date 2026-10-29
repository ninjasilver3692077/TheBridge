import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { buttonPrimaryLg, eyebrow } from "../styles/ui.js";

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = () => {
    localStorage.setItem("thebridge:authenticated", "true");
    navigate("/my-books", { replace: true });
  };

  return (
    <AppShell
      title="Sign in"
      subtitle="Access your personal TheBridge space"
    >
      <section className="mx-auto mt-4 max-w-md rounded-3xl border border-line bg-surface p-8 text-center shadow-card sm:mt-12 sm:p-10">
        <img
          src={`${import.meta.env.BASE_URL}assets/brand/thebridge-logo.svg`}
          alt=""
          className="mx-auto h-12 w-14 object-contain dark:hidden"
        />
        <img
          src={`${import.meta.env.BASE_URL}assets/brand/thebridge-logo-dark.svg`}
          alt=""
          className="mx-auto hidden h-12 w-14 object-contain dark:block"
        />

        <p className={`mt-6 ${eyebrow}`}>Member access</p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">
          Welcome to TheBridge
        </h1>

        <p className="mt-3 text-[15px] leading-7 text-ink-muted">
          This academic prototype uses a local authentication flag to
          demonstrate protected routes.
        </p>

        <button
          type="button"
          onClick={handleLogin}
          className={`mt-8 w-full ${buttonPrimaryLg}`}
        >
          Continue as member
        </button>
      </section>
    </AppShell>
  );
}

export default LoginPage;
