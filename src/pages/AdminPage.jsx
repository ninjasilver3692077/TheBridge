import AppShell from "../components/AppShell.jsx";
import { useSession } from "../hooks/useSession.js";
import { card, eyebrow, pageLead, pageTitle } from "../styles/ui.js";

function AdminPage() {
  const session = useSession();

  return (
    <AppShell title="Admin Area" subtitle="Moderate TheBridge community activity">
      <section className="max-w-3xl">
        <p className={eyebrow}>Admin Area</p>

        <h1 className={`mt-3 ${pageTitle}`}>
          Welcome, {session?.account.name ?? "Admin"}
        </h1>

        <p className={`mt-4 ${pageLead}`}>
          You are signed in with an Admin account. Moderation tools for
          members, listings and requests appear here.
        </p>
      </section>

      <section className={`mt-8 max-w-3xl p-6 ${card}`} aria-labelledby="admin-account-heading">
        <h2 id="admin-account-heading" className="text-lg font-bold text-ink">
          Account
        </h2>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-ink-muted">Email</dt>
            <dd className="mt-1 text-ink">{session?.account.email}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink-muted">Role</dt>
            <dd className="mt-1 text-ink">{session?.account.role}</dd>
          </div>
        </dl>
      </section>
    </AppShell>
  );
}

export default AdminPage;
