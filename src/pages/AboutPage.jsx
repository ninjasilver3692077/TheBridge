import AppShell from "../components/AppShell.jsx";
import AboutFlow from "../components/about/AboutFlow.jsx";
import TeamSection from "../components/about/TeamSection.jsx";
import UserStories from "../components/about/UserStories.jsx";
import {
  aboutFlow,
  aboutSections,
  teamMembers,
  userStories,
} from "../data/aboutContent.js";
import { card, eyebrow, pageLead } from "../styles/ui.js";

function AboutSection({ section }) {
  return (
    <article className={`p-6 sm:p-8 ${card}`}>
      <p className={eyebrow}>{section.eyebrow}</p>

      <h2 className="mt-3 text-xl font-bold tracking-tight text-ink">
        {section.title}
      </h2>

      {section.body && (
        <p className="mt-4 text-[15px] leading-7 text-ink-muted">
          {section.body}
        </p>
      )}

      {section.items && (
        <dl className="mt-5 divide-y divide-line">
          {section.items.map((item) => (
            <div key={item.label} className="py-3 first:pt-0 last:pb-0">
              <dt className="text-sm font-semibold text-ink">{item.label}</dt>

              <dd className="mt-1 text-sm leading-6 text-ink-muted">
                {item.text}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}

function AboutPage() {
  return (
    <AppShell
      title="About TheBridge"
      subtitle="Why TheBridge exists and how people use it"
    >
      <div className="space-y-6">
        <header className="max-w-3xl pb-6 pt-2 lg:pt-6">
          <p className={eyebrow}>TheBridge</p>

          <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl">
            A simpler way for people to share physical books.
          </h1>

          <p className={`mt-5 max-w-2xl sm:text-lg sm:leading-8 ${pageLead}`}>
            TheBridge is a community book marketplace for people who want to
            exchange, lend, rent, or sell physical books.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {aboutSections.map((section) => (
            <AboutSection key={section.eyebrow} section={section} />
          ))}
        </div>

        <AboutFlow steps={aboutFlow} />
        <UserStories stories={userStories} />
        <TeamSection members={teamMembers} />
      </div>
    </AppShell>
  );
}

export default AboutPage;
