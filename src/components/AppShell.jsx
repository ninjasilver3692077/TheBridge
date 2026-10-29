import { useEffect, useState } from "react";
import BottomNavigation from "./BottomNavigation.jsx";
import Sidebar from "./Sidebar.jsx";
import TopHeader from "./TopHeader.jsx";

function AppShell({
  children,
  title = "TheBridge",
  subtitle = "Find your next book connection",
}) {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);

    try {
      localStorage.setItem("thebridge:theme", isDark ? "dark" : "light");
    } catch {
      return undefined;
    }
  }, [isDark]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((current) => !current)}
      />

      <div
        className={`min-h-screen transition-[padding] duration-200 ${
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <TopHeader
          title={title}
          subtitle={subtitle}
          isDark={isDark}
          isOnline={isOnline}
          onToggleTheme={() => setIsDark((current) => !current)}
        />

        <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pb-16">
          {children}
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default AppShell;
