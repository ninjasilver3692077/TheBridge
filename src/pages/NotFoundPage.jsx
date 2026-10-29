import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { buttonPrimary, eyebrow, pageLead } from "../styles/ui.js";

function NotFoundPage() {
  return (
    <AppShell
      title="Page not found"
      subtitle="The requested page does not exist"
    >
      <section className="mx-auto max-w-xl py-16 text-center sm:py-24">
        <p
          className="text-7xl font-bold tracking-tight text-wine/20 sm:text-8xl"
          aria-hidden="true"
        >
          404
        </p>

        <p className={`mt-4 ${eyebrow}`}>Error 404</p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink">
          This bridge leads nowhere.
        </h1>

        <p className={`mt-4 ${pageLead}`}>
          The page may have moved or the address may be incorrect.
        </p>

        <Link to="/" className={`mt-8 ${buttonPrimary}`}>
          Return home
        </Link>
      </section>
    </AppShell>
  );
}

export default NotFoundPage;
