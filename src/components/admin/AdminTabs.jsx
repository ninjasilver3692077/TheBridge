import { focusRing } from "../../styles/ui.js";

function AdminTabs({ tabs, activeTab, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Moderation sections"
      className="mt-10 inline-flex rounded-xl bg-surface-muted p-1"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab;

        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={`rounded-lg px-4 py-2 text-sm transition-colors ${focusRing} ${
              isActive
                ? "bg-surface font-semibold text-ink shadow-sm"
                : "font-medium text-ink-muted hover:text-ink"
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}

export default AdminTabs;
