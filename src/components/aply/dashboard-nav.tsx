"use client";
/**
 * Dashboard navigation context — view switching instead of marketing scroll.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type DashView =
  | "overview"
  | "approvals"
  | "offers"
  | "platforms"
  | "history"
  | "analytics"
  | "resume"
  | "training"
  | "settings"
  | "extension";

export type DashNavItem = {
  id: DashView;
  icon: string;
  labelKey: string;
  group: "work" | "data" | "setup";
};

export const DASH_NAV: DashNavItem[] = [
  { id: "overview", icon: "pulse", labelKey: "nav.monitoring", group: "work" },
  { id: "approvals", icon: "inbox", labelKey: "nav.approvals", group: "work" },
  { id: "offers", icon: "briefcase", labelKey: "nav.offers", group: "work" },
  { id: "platforms", icon: "globe", labelKey: "nav.platforms", group: "work" },
  { id: "history", icon: "history", labelKey: "nav.history", group: "data" },
  { id: "analytics", icon: "graph", labelKey: "nav.analytics", group: "data" },
  { id: "resume", icon: "file", labelKey: "nav.resume", group: "setup" },
  { id: "training", icon: "book", labelKey: "nav.training", group: "setup" },
  { id: "settings", icon: "gear", labelKey: "nav.settings", group: "setup" },
  { id: "extension", icon: "browser", labelKey: "nav.extension", group: "setup" },
];

type DashNavContextValue = {
  view: DashView;
  setView: (v: DashView) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
};

const DashNavContext = createContext<DashNavContextValue | null>(null);

const SIDEBAR_KEY = "aply-dash-sidebar-collapsed";

export function readStoredSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}

export function DashNavProvider({
  children,
  initial = "overview",
  initialSidebarCollapsed = false,
}: {
  children: ReactNode;
  initial?: DashView;
  initialSidebarCollapsed?: boolean;
}) {
  const [view, setViewState] = useState<DashView>(initial);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(
    initialSidebarCollapsed
  );

  const setView = useCallback((v: DashView) => {
    setViewState(v);
    try {
      localStorage.setItem("aply-dash-view", v);
    } catch {
      /* ignore */
    }
  }, []);

  const setSidebarCollapsed = useCallback((v: boolean) => {
    setSidebarCollapsedState(v);
    try {
      localStorage.setItem(SIDEBAR_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      view,
      setView,
      sidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
    }),
    [view, setView, sidebarCollapsed, toggleSidebar, setSidebarCollapsed]
  );
  return (
    <DashNavContext.Provider value={value}>{children}</DashNavContext.Provider>
  );
}

export function useDashNav() {
  const ctx = useContext(DashNavContext);
  if (!ctx) throw new Error("useDashNav must be used inside DashNavProvider");
  return ctx;
}

export function readStoredDashView(): DashView {
  try {
    const v = localStorage.getItem("aply-dash-view") as DashView | null;
    if (v && DASH_NAV.some((n) => n.id === v)) return v;
  } catch {
    /* ignore */
  }
  return "overview";
}
