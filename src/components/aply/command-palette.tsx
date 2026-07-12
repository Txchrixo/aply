"use client";
/**
 * CommandPalette · Cmd/Ctrl+K global search & navigation.
 * Lets users jump to any section, search platforms, or trigger actions
 * (scan now, switch language, toggle monitoring).
 */
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Icon } from "@/components/aply/icon";
import { useI18n, type Locale } from "@/components/aply/i18n";
import { apiFetch } from "@/components/aply/utils";
import type { Platform, PlatformListResponse } from "@/components/aply/types";
import { useDashNav, type DashView } from "@/components/aply/dashboard-nav";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  onScan: () => void;
  onToggleMonitoring: () => void;
  monitoringEnabled: boolean;
}

interface CommandEntry {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  group: "navigate" | "action" | "platform" | "language";
  action: () => void;
  keywords?: string;
}

export function CommandPalette({
  onScan,
  onToggleMonitoring,
  monitoringEnabled,
}: CommandPaletteProps) {
  const { t, locale, setLocale } = useI18n();
  const { setView } = useDashNav();
  const [open, setOpen] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [search, setSearch] = useState("");

  // Load platforms for search (debounced, only when palette opens)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ pageSize: "50" });
        if (search) params.set("q", search);
        const res = await apiFetch<PlatformListResponse>(
          `/api/platforms?${params.toString()}`
        );
        if (!cancelled) setPlatforms(res.items.slice(0, 8));
      } catch {
        /* silent */
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, search]);

  // Global keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const closeAnd = useCallback((fn: () => void) => {
    return () => {
      fn();
      setOpen(false);
    };
  }, []);

  // Track recently used navigation items in localStorage
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aply-recent-nav");
      if (saved) setRecent(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  const trackRecent = useCallback((id: string) => {
    setRecent((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 3);
      try {
        localStorage.setItem("aply-recent-nav", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const goTo = useCallback(
    (view: DashView) => {
      setView(view);
      trackRecent(view);
    },
    [setView, trackRecent]
  );

  const navItems: CommandEntry[] = useMemo(
    () => [
      { id: "nav-mon", label: t("nav.monitoring"), icon: "pulse", group: "navigate", action: closeAnd(() => goTo("overview")) },
      { id: "nav-app", label: t("nav.approvals"), icon: "inbox", group: "navigate", action: closeAnd(() => goTo("approvals")) },
      { id: "nav-off", label: t("nav.offers"), icon: "briefcase", group: "navigate", action: closeAnd(() => goTo("offers")) },
      { id: "nav-plat", label: t("nav.platforms"), icon: "globe", group: "navigate", action: closeAnd(() => goTo("platforms")) },
      { id: "nav-hist", label: t("nav.history"), icon: "history", group: "navigate", action: closeAnd(() => goTo("history")) },
      { id: "nav-an", label: t("nav.analytics"), icon: "graph", group: "navigate", action: closeAnd(() => goTo("analytics")) },
      { id: "nav-res", label: t("nav.resume"), icon: "file", group: "navigate", action: closeAnd(() => goTo("resume")) },
      { id: "nav-ext", label: t("nav.extension"), icon: "browser", group: "navigate", action: closeAnd(() => goTo("extension")) },
      { id: "nav-set", label: t("nav.settings"), icon: "gear", group: "navigate", action: closeAnd(() => goTo("settings")) },
    ],
    [t, closeAnd, goTo]
  );

  const actionItems: CommandEntry[] = useMemo(
    () => [
      {
        id: "act-scan",
        label: t("monitoring.scanNow"),
        hint: "⌘↵",
        icon: "sync",
        group: "action",
        action: closeAnd(onScan),
        keywords: "scan search detect offers",
      },
      {
        id: "act-mon",
        label: monitoringEnabled ? "Pause monitoring" : "Resume monitoring",
        icon: monitoringEnabled ? "pause" : "play",
        group: "action",
        action: closeAnd(onToggleMonitoring),
        keywords: "pause resume monitoring toggle",
      },
    ],
    [t, closeAnd, onScan, onToggleMonitoring, monitoringEnabled]
  );

  const langItems: CommandEntry[] = useMemo(
    () =>
      (["en", "fr", "de"] as Locale[]).map((l) => ({
        id: `lang-${l}`,
        label: l === "en" ? "English" : l === "fr" ? "Français" : "Deutsch",
        icon: "globe",
        group: "language",
        action: closeAnd(() => setLocale(l)),
        keywords: l,
      })),
    [closeAnd, setLocale]
  );

  const platformItems: CommandEntry[] = useMemo(
    () =>
      platforms.map((p) => ({
        id: `pf-${p.id}`,
        label: p.name,
        hint: p.category,
        icon: "globe",
        group: "platform",
        action: closeAnd(() => {
          window.open(p.url, "_blank", "noopener,noreferrer");
        }),
        keywords: `${p.name} ${p.category} ${p.languages.join(" ")}`,
      })),
    [platforms, closeAnd]
  );

  // Build recent items from the navItems based on the recent[] array
  const recentItems: CommandEntry[] = useMemo(() => {
    if (recent.length === 0) return [];
    const sectionToNav: Record<string, CommandEntry> = {
      overview: navItems[0],
      approvals: navItems[1],
      offers: navItems[2],
      platforms: navItems[3],
      history: navItems[4],
      analytics: navItems[5],
      resume: navItems[6],
      extension: navItems[7],
      settings: navItems[8],
      // legacy hash ids from older sessions
      monitoring: navItems[0],
    };
    return recent
      .map((section) => sectionToNav[section])
      .filter(Boolean)
      .map((item) => ({
        ...item,
        id: `recent-${item.id}`,
        group: "recent" as const,
        hint: "recent",
      }));
  }, [recent, navItems]);

  // Combine for filtering · CommandDialog does its own filtering via keywords,
  // but we also want to show the right groups. cmdk handles filtering natively.
  const hasResults =
    recentItems.length + navItems.length + actionItems.length + langItems.length + platformItems.length > 0;

  return (
    <>
      {/* Invisible trigger hint · the actual shortcut is global, but we show a
          subtle "⌘K" pill in the header via a separate render. */}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="border-[#CFC5BE] bg-[#FFF4DC]"
      >
        <CommandInput
          placeholder={t("command.placeholder")}
          value={search}
          onValueChange={setSearch}
        />
        <CommandList className="aply-scroll max-h-[28rem]">
          <CommandEmpty className="py-8 text-sm text-[#79695E]">
            {t("command.empty")}
          </CommandEmpty>

          {recentItems.length > 0 && !search && (
            <CommandGroup
              heading={t("command.group.recent")}
              className="[&_[cmdk-group-heading]]:text-[#8B4513] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
            >
              {recentItems.map((item) => (
                <CommandItemWrapper key={item.id} item={item} />
              ))}
            </CommandGroup>
          )}

          <CommandGroup
            heading={t("command.group.navigate")}
            className="[&_[cmdk-group-heading]]:text-[#C65D00] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
          >
            {navItems.map((item) => (
              <CommandItemWrapper key={item.id} item={item} />
            ))}
          </CommandGroup>

          <CommandGroup
            heading={t("command.group.action")}
            className="[&_[cmdk-group-heading]]:text-[#C65D00] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
          >
            {actionItems.map((item) => (
              <CommandItemWrapper key={item.id} item={item} />
            ))}
          </CommandGroup>

          {platformItems.length > 0 && (
            <>
              <CommandSeparator className="bg-[#CFC5BE]" />
              <CommandGroup
                heading={t("command.group.platforms")}
                className="[&_[cmdk-group-heading]]:text-[#C65D00] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
              >
                {platformItems.map((item) => (
                  <CommandItemWrapper key={item.id} item={item} />
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator className="bg-[#CFC5BE]" />
          <CommandGroup
            heading={t("command.group.language")}
            className="[&_[cmdk-group-heading]]:text-[#C65D00] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
          >
            {langItems.map((item) => (
              <CommandItemWrapper
                key={item.id}
                item={item}
                active={locale === item.id.replace("lang-", "")}
              />
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* ⌘K trigger pill · rendered in the header by the parent */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t("command.label")}
        className="hidden items-center gap-2 rounded-md border border-[#CFC5BE] bg-[#FFE4B5] px-2.5 py-1.5 text-xs text-[#79695E] transition-colors hover:border-[#C65D00] hover:text-[#C65D00] xl:flex"
      >
        <Icon name="search" size={12} />
        <span>{t("command.label")}</span>
        <kbd className="ml-1 rounded border border-[#CFC5BE] bg-[#FFF4DC] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#4A2F1A]">
          ⌘K
        </kbd>
      </button>
    </>
  );
}

function CommandItemWrapper({
  item,
  active,
}: {
  item: CommandEntry;
  active?: boolean;
}) {
  return (
    <CommandItem
      value={`${item.label} ${item.keywords ?? ""}`}
      onSelect={item.action}
      className={cn(
        "gap-2.5 text-sm text-[#4A2F1A] data-[selected=true]:bg-[#FFE4B5] data-[selected=true]:text-[#C65D00]",
        active && "bg-[#FFE4B5]"
      )}
    >
      <Icon name={item.icon} size={15} className="shrink-0 text-[#C65D00]" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.hint && (
        <span className="text-[11px] font-mono text-[#79695E]">{item.hint}</span>
      )}
      {active && (
        <Icon name="check" size={14} className="text-[#C65D00]" />
      )}
    </CommandItem>
  );
}
