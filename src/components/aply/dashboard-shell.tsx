"use client";
/**
 * App shell for the dashboard — cocoa sidebar + dense workspace.
 * Sidebar can expand / collapse (icon rail); preference persisted.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/aply/icon";
import { useI18n } from "@/components/aply/i18n";
import { LanguageSwitcher } from "@/components/aply/language-switcher";
import { ActivityPopover } from "@/components/aply/activity-popover";
import { ThemeToggle } from "@/components/aply/theme-toggle";
import {
  DASH_NAV,
  DashNavProvider,
  readStoredDashView,
  readStoredSidebarCollapsed,
  useDashNav,
  type DashView,
} from "@/components/aply/dashboard-nav";
import { cn } from "@/lib/utils";

const VIEW_TITLES: Record<DashView, string> = {
  overview: "nav.monitoring",
  approvals: "nav.approvals",
  offers: "nav.offers",
  platforms: "nav.platforms",
  history: "nav.history",
  analytics: "nav.analytics",
  resume: "nav.resume",
  training: "nav.training",
  settings: "nav.settings",
  extension: "nav.extension",
};

function Sidebar({
  monitoringEnabled,
  pendingCount,
}: {
  monitoringEnabled: boolean;
  pendingCount: number;
}) {
  const { t } = useI18n();
  const { view, setView, sidebarCollapsed, toggleSidebar } = useDashNav();

  const groups: Array<{ key: "work" | "data" | "setup"; label: string }> = [
    { key: "work", label: "Work" },
    { key: "data", label: "Data" },
    { key: "setup", label: "Setup" },
  ];

  return (
    <aside
      className={cn(
        "aply-sidebar flex shrink-0 flex-col border-r border-[#3D2A1C] bg-[#24160E] text-[#F3E6D4] transition-[width] duration-200 ease-out",
        sidebarCollapsed ? "w-[3.75rem]" : "w-[15.5rem]"
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-[#3D2A1C]",
          sidebarCollapsed ? "justify-center px-1.5" : "gap-2 px-3"
        )}
      >
        {!sidebarCollapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="font-heading text-lg font-semibold tracking-tight text-[#FFF4DC]">
              Aply
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#A8927A]">
              Local agent
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
          aria-expanded={!sidebarCollapsed}
          title={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#A8927A] transition-colors hover:bg-[#3A2417] hover:text-[#FFF4DC]"
        >
          <Icon
            name={sidebarCollapsed ? "sidebar-expand" : "sidebar-collapse"}
            size={16}
          />
        </button>
      </div>

      <nav
        className="aply-scroll flex-1 overflow-y-auto px-1.5 py-3"
        aria-label="Dashboard"
      >
        {groups.map((g) => (
          <div key={g.key} className="mb-3">
            {!sidebarCollapsed && (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A7460]">
                {g.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {DASH_NAV.filter((n) => n.group === g.key).map((item) => {
                const active = view === item.id;
                const badge =
                  item.id === "approvals" && pendingCount > 0
                    ? pendingCount
                    : null;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setView(item.id)}
                      title={t(item.labelKey)}
                      className={cn(
                        "relative flex w-full items-center rounded-md text-left text-[13px] transition-colors",
                        sidebarCollapsed
                          ? "justify-center px-0 py-2.5"
                          : "gap-2.5 px-2.5 py-2",
                        active
                          ? "bg-[#C65D00] text-[#FFF4DC]"
                          : "text-[#D4C4B0] hover:bg-[#3A2417] hover:text-[#FFF4DC]"
                      )}
                    >
                      <Icon
                        name={item.icon}
                        size={15}
                        className="shrink-0 opacity-90"
                      />
                      {!sidebarCollapsed && (
                        <>
                          <span className="min-w-0 flex-1 truncate">
                            {t(item.labelKey)}
                          </span>
                          {badge !== null && (
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                                active
                                  ? "bg-[#FFF4DC]/20 text-[#FFF4DC]"
                                  : "bg-[#FF9F1C]/20 text-[#FF9F1C]"
                              )}
                            >
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                      {sidebarCollapsed && badge !== null && (
                        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#FF9F1C]" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "border-t border-[#3D2A1C]",
          sidebarCollapsed ? "px-1.5 py-2" : "px-3 py-3"
        )}
      >
        <div
          className={cn(
            "flex items-center rounded-md text-xs",
            sidebarCollapsed ? "justify-center py-2" : "gap-2 px-2.5 py-2",
            monitoringEnabled
              ? "bg-[#1F3A24] text-[#7DCEA0]"
              : "bg-[#3A2417] text-[#A8927A]"
          )}
          title={monitoringEnabled ? "Monitoring live" : "Monitoring paused"}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            {monitoringEnabled && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2ea043] opacity-50" />
            )}
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                monitoringEnabled ? "bg-[#2ea043]" : "bg-[#79695E]"
              )}
            />
          </span>
          {!sidebarCollapsed &&
            (monitoringEnabled ? "Monitoring live" : "Monitoring paused")}
        </div>
      </div>
    </aside>
  );
}

function Topbar({
  monitoringEnabled,
  children,
}: {
  monitoringEnabled: boolean;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const { view } = useDashNav();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-sm sm:px-5">
      <div className="min-w-0">
        <h1 className="truncate font-heading text-base font-semibold text-foreground first-letter:text-[1.45em] sm:text-lg sm:first-letter:text-[1.4em]">
          {t(VIEW_TITLES[view])}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <span
          className={cn(
            "hidden items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium md:inline-flex",
            monitoringEnabled
              ? "bg-[#2ea043]/12 text-[#1f7a32]"
              : "bg-muted text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              monitoringEnabled ? "bg-[#2ea043]" : "bg-muted-foreground"
            )}
          />
          {monitoringEnabled ? "Live" : "Paused"}
        </span>
        <LanguageSwitcher />
        {children}
        <ActivityPopover />
        <ThemeToggle />
      </div>
    </header>
  );
}

function MobileTabBar() {
  const { t } = useI18n();
  const { view, setView } = useDashNav();
  const items = DASH_NAV.filter((n) =>
    ["overview", "approvals", "offers", "platforms", "analytics", "settings"].includes(
      n.id
    )
  );

  return (
    <nav
      aria-label="Mobile"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {items.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon name={item.icon} size={18} />
              <span className="truncate">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function ShellInner({
  monitoringEnabled,
  pendingCount,
  topbarExtra,
  children,
}: {
  monitoringEnabled: boolean;
  pendingCount: number;
  topbarExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="aply-app flex h-dvh overflow-hidden bg-background">
      <div className="hidden lg:flex">
        <Sidebar
          monitoringEnabled={monitoringEnabled}
          pendingCount={pendingCount}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar monitoringEnabled={monitoringEnabled}>{topbarExtra}</Topbar>
        <main className="aply-workspace aply-scroll min-h-0 flex-1 overflow-y-auto pb-20 lg:pb-4">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-4 sm:px-5 sm:py-5">
            {children}
          </div>
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}

export function DashboardShell({
  monitoringEnabled,
  pendingCount,
  topbarExtra,
  children,
}: {
  monitoringEnabled: boolean;
  pendingCount: number;
  topbarExtra?: ReactNode;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [initial, setInitial] = useState<DashView>("overview");
  const [initialCollapsed, setInitialCollapsed] = useState(false);

  useEffect(() => {
    setInitial(readStoredDashView());
    setInitialCollapsed(readStoredSidebarCollapsed());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Icon name="sync" size={22} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <DashNavProvider
      initial={initial}
      initialSidebarCollapsed={initialCollapsed}
    >
      <ShellInner
        monitoringEnabled={monitoringEnabled}
        pendingCount={pendingCount}
        topbarExtra={topbarExtra}
      >
        {children}
      </ShellInner>
    </DashNavProvider>
  );
}
