"use client";
/**
 * Aply dashboard · single page assembling every section.
 * Wraps everything in min-h-screen flex flex-col so the footer sticks.
 * I18nProvider gives every section access to the current locale + t().
 * CommandPalette provides Cmd/Ctrl+K global search & navigation.
 * AutoScan keeps monitoring running on the configured interval.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { I18nProvider } from "@/components/aply/i18n";
import { AplyHeader } from "@/components/aply/header";
import { Hero } from "@/components/aply/hero";
import { MonitoringSection } from "@/components/aply/monitoring-section";
import { ApprovalsSection } from "@/components/aply/approvals-section";
import { PlatformsSection } from "@/components/aply/platforms-section";
import { HistorySection } from "@/components/aply/history-section";
import { AnalyticsSection } from "@/components/aply/analytics-section";
import { TrainingSection } from "@/components/aply/training-section";
import { ResumeSection } from "@/components/aply/resume-section";
import { SettingsSection } from "@/components/aply/settings-section";
import { ExtensionSection } from "@/components/aply/extension-section";
import { AplyFooter } from "@/components/aply/footer";
import { CommandPalette } from "@/components/aply/command-palette";
import { KeyboardShortcutsHelp } from "@/components/aply/keyboard-shortcuts-help";
import { OnboardingBanner } from "@/components/aply/onboarding-banner";
import type { Settings, Stats } from "@/components/aply/types";
import { apiFetch } from "@/components/aply/utils";
import { toast } from "sonner";

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  // Bump this to force MonitoringSection to re-scan
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
    loadAll();
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

  // Called by MonitoringSection when a manual scan completes
  const handleScan = useCallback(() => {
    loadStats();
  }, [loadStats]);

  // Command palette: trigger a scan
  const handleCommandScan = useCallback(async () => {
    if (scanInProgress.current) return;
    scanInProgress.current = true;
    setScanTick((t) => t + 1); // tell MonitoringSection to scan
    // Also do a direct scan from here so it works even if monitoring section isn't mounted
    try {
      await apiFetch("/api/scan", { method: "POST" });
      loadStats();
      toast.success("Scan triggered from command palette");
    } catch {
      /* MonitoringSection handles its own toast */
    } finally {
      scanInProgress.current = false;
    }
  }, [loadStats]);

  const handleCommandToggleMonitoring = useCallback(async () => {
    const next = !(settings?.monitoringEnabled ?? true);
    await handleSettingsChange({ monitoringEnabled: next });
    toast.success(next ? "Monitoring resumed" : "Monitoring paused");
  }, [settings?.monitoringEnabled, handleSettingsChange]);

  // Auto-scan: runs on an interval based on settings.scanIntervalMinutes
  // Only when monitoring is enabled. Keeps the "24/7" promise.
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
        if (res.newOffers.length > 0) {
          loadStats();
        }
      } catch {
        /* silent · don't spam toasts on background scans */
      } finally {
        scanInProgress.current = false;
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [settings?.monitoringEnabled, settings?.scanIntervalMinutes, loadStats]);

  return (
    <I18nProvider>
      <div className="flex min-h-screen flex-col">
        <AplyHeader monitoringEnabled={stats?.monitoringEnabled ?? true}>
          <CommandPalette
            onScan={handleCommandScan}
            onToggleMonitoring={handleCommandToggleMonitoring}
            monitoringEnabled={stats?.monitoringEnabled ?? true}
          />
        </AplyHeader>
        <OnboardingBanner />
        <main className="flex-1">
          <Hero stats={stats} loading={loading} />
          <MonitoringSection
            stats={stats}
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onScan={handleScan}
            scanTick={scanTick}
          />
          <ApprovalsSection onApprove={handleApprove} />
          <PlatformsSection />
          <HistorySection />
          <AnalyticsSection />
          <TrainingSection />
          <ResumeSection />
          <SettingsSection
            settings={settings}
            loading={loading}
            onSettingsChange={handleSettingsChange}
          />
          <ExtensionSection />
        </main>
        <AplyFooter />
      </div>
      <KeyboardShortcutsHelp onScan={handleCommandScan} />
    </I18nProvider>
  );
}
