"use client";
/**
 * Aply dashboard · app shell with panel views (not a marketing scroll page).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { I18nProvider } from "@/components/aply/i18n";
import { DashboardShell } from "@/components/aply/dashboard-shell";
import { DashboardOverviewBar } from "@/components/aply/dashboard-overview-bar";
import { useDashNav } from "@/components/aply/dashboard-nav";
import { MonitoringSection } from "@/components/aply/monitoring-section";
import { ApprovalsSection } from "@/components/aply/approvals-section";
import { OffersSection } from "@/components/aply/offers-section";
import { PlatformsSection } from "@/components/aply/platforms-section";
import { HistorySection } from "@/components/aply/history-section";
import { AnalyticsSection } from "@/components/aply/analytics-section";
import { TrainingSection } from "@/components/aply/training-section";
import { ResumeSection } from "@/components/aply/resume-section";
import { SettingsSection } from "@/components/aply/settings-section";
import { ExtensionSection } from "@/components/aply/extension-section";
import { CommandPalette } from "@/components/aply/command-palette";
import { KeyboardShortcutsHelp } from "@/components/aply/keyboard-shortcuts-help";
import { OnboardingBanner } from "@/components/aply/onboarding-banner";
import type { Settings, Stats } from "@/components/aply/types";
import { apiFetch } from "@/components/aply/utils";
import { toast } from "sonner";

function DashboardViews({
  stats,
  settings,
  loading,
  scanTick,
  onSettingsChange,
  onApprove,
  onScan,
}: {
  stats: Stats | null;
  settings: Settings | null;
  loading: boolean;
  scanTick: number;
  onSettingsChange: (s: Partial<Settings>) => Promise<Settings>;
  onApprove: () => void;
  onScan: () => void;
}) {
  const { view } = useDashNav();

  return (
    <>
      {view === "overview" && (
        <div className="space-y-4">
          <DashboardOverviewBar stats={stats} loading={loading} />
          <MonitoringSection
            stats={stats}
            settings={settings}
            onSettingsChange={onSettingsChange}
            onScan={onScan}
            scanTick={scanTick}
          />
        </div>
      )}
      {view === "approvals" && <ApprovalsSection onApprove={onApprove} />}
      {view === "offers" && <OffersSection />}
      {view === "platforms" && <PlatformsSection />}
      {view === "history" && <HistorySection />}
      {view === "analytics" && <AnalyticsSection />}
      {view === "resume" && <ResumeSection />}
      {view === "training" && <TrainingSection />}
      {view === "settings" && (
        <SettingsSection
          settings={settings}
          loading={loading}
          onSettingsChange={onSettingsChange}
        />
      )}
      {view === "extension" && <ExtensionSection />}
    </>
  );
}

function DashboardApp() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanTick, setScanTick] = useState(0);
  const scanInProgress = useRef(false);

  const loadStats = useCallback(async () => {
    try {
      const s = await apiFetch<Stats>("/api/stats");
      setStats(s);
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const s = await apiFetch<Settings>("/api/settings");
      setSettings(s);
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadStats(), loadSettings()]);
    setLoading(false);
  }, [loadStats, loadSettings]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ob = await fetch("/api/onboarding").then((r) => r.json());
        if (cancelled) return;
        if (!ob.completed) {
          window.location.replace("/onboarding");
          return;
        }
      } catch {
        /* proceed */
      }
      if (!cancelled) loadAll();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  const handleSettingsChange = useCallback(
    async (partial: Partial<Settings>) => {
      const updated = await apiFetch<Settings>("/api/settings", {
        method: "POST",
        body: JSON.stringify(partial),
      });
      setSettings(updated);
      setStats((prev) =>
        prev
          ? {
              ...prev,
              monitoringEnabled: updated.monitoringEnabled,
              scanIntervalMinutes: updated.scanIntervalMinutes,
              languages: updated.languages,
            }
          : prev
      );
      return updated;
    },
    []
  );

  const handleApprove = useCallback(() => {
    loadStats();
  }, [loadStats]);

  const handleScan = useCallback(() => {
    loadStats();
  }, [loadStats]);

  const handleCommandScan = useCallback(async () => {
    if (scanInProgress.current) return;
    scanInProgress.current = true;
    setScanTick((t) => t + 1);
    try {
      await apiFetch("/api/scan", { method: "POST" });
      loadStats();
      toast.success("Scan triggered");
    } catch {
      /* MonitoringSection toasts */
    } finally {
      scanInProgress.current = false;
    }
  }, [loadStats]);

  const handleCommandToggleMonitoring = useCallback(async () => {
    const next = !(settings?.monitoringEnabled ?? true);
    await handleSettingsChange({ monitoringEnabled: next });
    toast.success(next ? "Monitoring resumed" : "Monitoring paused");
  }, [settings?.monitoringEnabled, handleSettingsChange]);

  useEffect(() => {
    if (!settings?.monitoringEnabled) return;
    const intervalMs = (settings.scanIntervalMinutes ?? 15) * 60 * 1000;
    const id = setInterval(async () => {
      if (scanInProgress.current) return;
      scanInProgress.current = true;
      try {
        const res = await apiFetch<{ newOffers: unknown[] }>("/api/scan", {
          method: "POST",
        });
        if (res.newOffers.length > 0) loadStats();
      } catch {
        /* silent */
      } finally {
        scanInProgress.current = false;
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [settings?.monitoringEnabled, settings?.scanIntervalMinutes, loadStats]);

  return (
    <DashboardShell
      monitoringEnabled={stats?.monitoringEnabled ?? true}
      pendingCount={stats?.pendingApprovals ?? 0}
      topbarExtra={
        <CommandPalette
          onScan={handleCommandScan}
          onToggleMonitoring={handleCommandToggleMonitoring}
          monitoringEnabled={stats?.monitoringEnabled ?? true}
        />
      }
    >
      <OnboardingBanner />
      <DashboardViews
        stats={stats}
        settings={settings}
        loading={loading}
        scanTick={scanTick}
        onSettingsChange={handleSettingsChange}
        onApprove={handleApprove}
        onScan={handleScan}
      />
      <KeyboardShortcutsHelp onScan={handleCommandScan} />
    </DashboardShell>
  );
}

export default function Home() {
  return (
    <I18nProvider>
      <DashboardApp />
    </I18nProvider>
  );
}
