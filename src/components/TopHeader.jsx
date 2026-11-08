import AccountMenu from "./header/AccountMenu.jsx";
import MobileBrand from "./header/MobileBrand.jsx";
import NetworkStatus from "./header/NetworkStatus.jsx";
import ThemeToggle from "./header/ThemeToggle.jsx";

function TopHeader({
  title = "TheBridge",
  subtitle = "Find your next book connection",
  isDark = false,
  isOnline = true,
  onToggleTheme,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[1180px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-2.5">
          <MobileBrand />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{title}</p>

            <p className="hidden truncate text-xs text-ink-muted sm:block">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <NetworkStatus isOnline={isOnline} />

          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
