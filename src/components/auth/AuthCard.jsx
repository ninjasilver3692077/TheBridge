import { eyebrow } from "../../styles/ui.js";

function AuthCard({ eyebrowText, heading, lead, children }) {
  return (
    <section className="mx-auto mt-4 max-w-md rounded-3xl border border-line bg-surface p-6 shadow-card sm:mt-12 sm:p-10">
      <div className="text-center">
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

        <p className={`mt-6 ${eyebrow}`}>{eyebrowText}</p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">
          {heading}
        </h1>

        <p className="mt-3 text-[15px] leading-7 text-ink-muted">{lead}</p>
      </div>

      {children}
    </section>
  );
}

export default AuthCard;
