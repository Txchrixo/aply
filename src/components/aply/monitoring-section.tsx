"use client";
/**
 * MonitoringSection · recently detected offers list + monitoring status panel
 * + "Scan now" manual trigger that injects new offers via /api/scan.
 */
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icon } from "@/components/aply/icon";
import { SectionHeading } from "@/components/aply/section-heading";
import { useI18n } from "@/components/aply/i18n";
import {
  CategoryBadge,
  ContractBadge,
  LangBadge,
  StatusBadge,
} from "@/components/aply/badges";
import type {
  Application,
  ApplicationListResponse,
  JobListResponse,
  JobOffer,
  Settings,
  Stats,
} from "@/components/aply/types";
import { apiFetch, initials, logoColor, relativeTime } from "@/components/aply/utils";

interface MonitoringSectionProps {
  stats: Stats | null;
  settings: Settings | null;
  onSettingsChange: (s: Partial<Settings>) => Promise<void>;
  onScan?: () => void;
  scanTick?: number;
}

interface DetectedRow {
  key: string;
  title: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  contractType: string | null;
  language: string | null;
  status: string;
  category: string;
  detectedAt: string;
  url: string;
  applicationId?: string;
  jobOfferId?: string;
  /** 0-100 import pipeline progress, only set for freshly detected offers. */
  importProgress?: number;
  /** Current pipeline step: detecting_fields | generating_letter | filling_form | ready. */
  importStep?: string;
}

interface ScanResult {
  ok: boolean;
  scannedCount: number;
  newOffers: Array<{ id: string; title: string; company: string; platformName: string }>;
}

const IMPORT_STEP_LABEL: Record<string, string> = {
  detecting_fields: "Detecting fields…",
  generating_letter: "Generating cover letter…",
  filling_form: "Filling form…",
  ready: "Ready",
};

function importStepLabel(step: string | undefined): string {
  if (!step) return "Importing…";
  return IMPORT_STEP_LABEL[step] ?? step;
}

function isRowImporting(row: DetectedRow): boolean {
  if (row.status === "importing") return true;
  if (row.importProgress !== undefined && row.importProgress < 100) return true;
  return false;
}

export function MonitoringSection({
  stats,
  settings,
  onSettingsChange,
  onScan,
  scanTick,
}: MonitoringSectionProps) {
  const { t } = useI18n();
  const [rows, setRows] = useState<DetectedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingMonitor, setTogglingMonitor] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [newOfferIds, setNewOfferIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, jobsRes] = await Promise.all([
        apiFetch<ApplicationListResponse>("/api/applications?status=pending_approval&pageSize=20"),
        apiFetch<JobListResponse>("/api/jobs?pageSize=20"),
      ]);
      const seen = new Set<string>();
      const merged: DetectedRow[] = [];

      for (const a of pendingRes.items as Application[]) {
        const k = a.jobOffer?.id ?? a.id;
        if (seen.has(k)) continue;
        seen.add(k);
        merged.push({
          key: `a-${a.id}`,
          title: a.jobOffer.title,
          company: a.jobOffer.company,
          location: a.jobOffer.location,
          salary: a.jobOffer.salary,
          contractType: a.jobOffer.contractType,
          language: a.jobOffer.language ?? a.language,
          status: a.status,
          category: a.jobOffer.platform?.category ?? "niche",
          detectedAt: a.jobOffer.detectedAt ?? a.createdAt,
          url: a.jobOffer.url,
          applicationId: a.id,
          jobOfferId: a.jobOffer.id,
          importProgress: a.jobOffer.importProgress ?? undefined,
          importStep: a.jobOffer.importStep ?? undefined,
        });
      }
      for (const j of jobsRes.items as JobOffer[]) {
        if (seen.has(j.id)) continue;
        seen.add(j.id);
        merged.push({
          key: `j-${j.id}`,
          title: j.title,
          company: j.company,
          location: j.location,
          salary: j.salary,
          contractType: j.contractType,
          language: j.language,
          status: j.status,
          category: j.platform?.category ?? "niche",
          detectedAt: j.detectedAt,
          url: j.url,
          jobOfferId: j.id,
          importProgress: j.importProgress ?? undefined,
          importStep: j.importStep ?? undefined,
        });
      }

      merged.sort(
        (a, b) =>
          new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
      );
      setRows(merged.slice(0, 8));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load recent offers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleMonitor = async (next: boolean) => {
    setTogglingMonitor(true);
    try {
      await onSettingsChange({ monitoringEnabled: next });
      toast.success(next ? "Monitoring resumed" : "Monitoring paused");
    } catch (e) {
      toast.error("Failed to update monitoring");
    } finally {
      setTogglingMonitor(false);
    }
  };

  const handlePrepare = async (jobOfferId: string) => {
    toast.loading(t("approvals.drafting"), { id: "prepare" });
    try {
      const res = await apiFetch<{
        coverLetter: string;
        qualityScore: number;
        applicationId?: string;
      }>("/api/generate", {
        method: "POST",
        body: JSON.stringify({ jobOfferId }),
      });
      toast.success(
        `${t("approvals.draftReady")} · ${t("approvals.quality")} ${Math.round(res.qualityScore * 100)}%`,
        { id: "prepare" }
      );
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed", {
        id: "prepare",
      });
    }
  };

  const handleScanNow = async () => {
    setScanning(true);
    try {
      const res = await apiFetch<ScanResult>("/api/scan", { method: "POST" });
      const count = res.newOffers.length;
      if (count > 0) {
        // Highlight newly detected offers
        const ids = new Set(res.newOffers.map((o) => o.id));
        setNewOfferIds(ids);
        toast.success(
          `Scan complete · ${count} new offer${count > 1 ? "s" : ""} detected`,
          {
            description: res.newOffers
              .map((o) => `• ${o.title} · ${o.company}`)
              .join("\n"),
          }
        );
        // Clear highlight after 6s
        setTimeout(() => setNewOfferIds(new Set()), 6000);
      } else {
        toast.success("Scan complete · no new offers this round");
      }
      load();
      onScan?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  // Respond to command-palette "Scan now" trigger
  useEffect(() => {
    if (scanTick && scanTick > 0) {
      handleScanNow();
    }
  }, [scanTick]);

  return (
    <section
      id="monitoring"
      aria-labelledby="monitoring-heading"
      className="px-4 py-12 md:px-6 md:py-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="monitoring-heading"
            eyebrow={t("monitoring.eyebrow")}
            title={t("monitoring.title")}
            subtitle={t("monitoring.subtitle")}
          />
          <Button
            onClick={handleScanNow}
            disabled={scanning}
            className="h-10 shrink-0 gap-2 rounded-lg bg-[#C65D00] px-4 text-sm font-medium text-[#FFE4B5] shadow-sm transition-all hover:bg-[#FF9F1C] hover:text-[#4A2F1A] hover:shadow-md disabled:opacity-60"
          >
            <Icon
              name="sync"
              size={15}
              className={scanning ? "animate-spin" : ""}
            />
            {scanning ? t("monitoring.scanning") : t("monitoring.scanNow")}
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Recently detected list */}
          <Card className={`lg:col-span-2 gap-0 rounded-xl border-[#CFC5BE] bg-[#FFF4DC] p-0 ${scanning ? "aply-radar border-[#C65D00]/40" : ""}`}>
            <div className="flex items-center justify-between border-b border-[#CFC5BE] px-5 py-4">
              <div className="flex items-center gap-2">
                <Icon name="pulse" size={16} className="text-[#C65D00]" />
                <h3 className="font-heading text-lg font-semibold text-[#4A2F1A]">
                  {t("monitoring.recent")}
                </h3>
              </div>
              <span className="text-xs text-[#79695E]">
                {rows.length} {t("monitoring.shown")}
              </span>
            </div>
            <ScrollArea className="h-[28rem]">
              <ul className="divide-y divide-[#CFC5BE]">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <li key={i} className="flex items-center gap-3 px-5 py-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                        <Skeleton className="h-7 w-16" />
                      </li>
                    ))
                  : rows.length === 0 ? (
                      <li className="flex flex-col items-center gap-3 px-5 py-16 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFE4B5] text-[#C65D00]">
                          <Icon name="search" size={20} />
                        </span>
                        <p className="text-sm text-[#79695E]">
                          {t("monitoring.empty")}
                        </p>
                      </li>
                    ) : (
                      rows.map((row) => {
                        const isNew = newOfferIds.has(row.jobOfferId ?? "");
                        const importing = isRowImporting(row);
                        const importPct = row.importProgress ?? 0;
                        return (
                          <motion.li
                            key={row.key}
                            layout
                            initial={isNew ? { opacity: 0, backgroundColor: "rgba(255,159,28,0.25)" } : false}
                            animate={{ opacity: 1, backgroundColor: "rgba(255,159,28,0)" }}
                            transition={{ duration: 1.2 }}
                            className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-[#FFE4B5]/60 sm:flex-row sm:items-center dark:hover:bg-[#4A2F1A]/60"
                          >
                            <span
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-[#FFE4B5]"
                              style={{
                                backgroundColor: logoColor(row.company ?? row.title),
                              }}
                              aria-hidden
                            >
                              {initials(row.company ?? row.title)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-medium text-[#4A2F1A] dark:text-[#FFE4B5]">
                                  {row.title}
                                </p>
                                <CategoryBadge category={row.category} />
                                {isNew && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-[#FF9F1C] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#4A2F1A]">
                                    <Icon name="zap" size={9} />
                                    New
                                  </span>
                                )}
                              </div>
                              {importing ? (
                                <div className="mt-1.5 flex items-center gap-2">
                                  <Icon
                                    name="sync"
                                    size={11}
                                    className="animate-spin text-[#C65D00] dark:text-[#FF9F1C]"
                                  />
                                  <span className="text-[11px] text-[#79695E] dark:text-[#C9B89F]">
                                    Importing · {importStepLabel(row.importStep)}
                                  </span>
                                  <div className="ml-1 h-1 w-20 overflow-hidden rounded-full bg-[#CFC5BE] dark:bg-[#5A3D26]">
                                    <div
                                      className="h-full rounded-full bg-[#C65D00] transition-all dark:bg-[#FF9F1C]"
                                      style={{ width: `${importPct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-medium text-[#79695E] dark:text-[#C9B89F]">
                                    {importPct}%
                                  </span>
                                </div>
                              ) : (
                                <p className="mt-0.5 truncate text-xs text-[#79695E] dark:text-[#C9B89F]">
                                  {row.company ?? "-"}
                                  {row.location ? ` · ${row.location}` : ""}
                                  {row.salary ? ` · ${row.salary}` : ""}
                                  {" · "}
                                  {relativeTime(row.detectedAt)}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {row.language && <LangBadge lang={row.language} />}
                              {row.contractType && (
                                <ContractBadge type={row.contractType} />
                              )}
                              {importing ? (
                                <span className="inline-flex items-center gap-1 rounded-md border border-[#C65D00]/30 bg-[#C65D00]/10 px-2 py-0.5 text-[11px] font-medium leading-none text-[#C65D00] dark:border-[#FF9F1C]/40 dark:bg-[#FF9F1C]/15 dark:text-[#FF9F1C]">
                                  <Icon name="sync" size={10} className="animate-spin" />
                                  Importing
                                </span>
                              ) : (
                                <StatusBadge status={row.status} />
                              )}
                              {importing && row.jobOfferId ? (
                                <Button
                                  size="sm"
                                  disabled
                                  className="h-7 gap-1 bg-[#C65D00] px-2.5 text-xs text-[#FFE4B5] opacity-60"
                                >
                                  <Icon name="sync" size={12} className="animate-spin" />
                                  {t("monitoring.prepare")}
                                </Button>
                              ) : row.status === "new" && row.jobOfferId ? (
                                <Button
                                  size="sm"
                                  onClick={() => handlePrepare(row.jobOfferId!)}
                                  className="h-7 gap-1 bg-[#C65D00] px-2.5 text-xs text-[#FFE4B5] hover:bg-[#FF9F1C]"
                                >
                                  <Icon name="pencil" size={12} />
                                  {t("monitoring.prepare")}
                                </Button>
                              ) : row.applicationId ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  asChild
                                  className="h-7 gap-1 border-[#CFC5BE] px-2.5 text-xs text-[#C65D00] hover:bg-[#FFE4B5] dark:border-[#5A3D26] dark:text-[#FF9F1C] dark:hover:bg-[#4A2F1A]"
                                >
                                  <a href="#approvals">
                                    <Icon name="eye" size={12} />
                                    {t("monitoring.review")}
                                  </a>
                                </Button>
                              ) : null}
                            </div>
                          </motion.li>
                        );
                      })
                    )}
              </ul>
            </ScrollArea>
          </Card>

          {/* Right column · status + strict mode */}
          <div className="flex flex-col gap-4">
            <Card className="gap-4 rounded-xl border-[#CFC5BE] bg-[#FFF4DC] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-70 ${
                        stats?.monitoringEnabled
                          ? "animate-ping bg-[#2ea043]"
                          : "bg-[#79695E]"
                      }`}
                    />
                    <span
                      className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                        stats?.monitoringEnabled ? "bg-[#2ea043]" : "bg-[#79695E]"
                      }`}
                    />
                  </span>
                  <h3 className="font-heading text-base font-semibold text-[#4A2F1A]">
                    {t("monitoring.status")}
                  </h3>
                </div>
                <Switch
                  checked={!!stats?.monitoringEnabled}
                  disabled={togglingMonitor}
                  onCheckedChange={handleToggleMonitor}
                  aria-label="Toggle monitoring"
                />
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-[#79695E]">
                    {t("monitoring.scanInterval")}
                  </dt>
                  <dd className="font-medium text-[#4A2F1A]">
                    {settings?.scanIntervalMinutes ?? stats?.scanIntervalMinutes ?? "-"} {t("monitoring.min")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#79695E]">
                    {t("monitoring.lastScan")}
                  </dt>
                  <dd className="font-medium text-[#4A2F1A]">
                    {relativeTime(stats?.lastScan)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-[#79695E]">
                    {t("monitoring.activeLanguages")}
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {(settings?.languages ?? stats?.languages ?? []).map((l) => (
                      <LangBadge key={l} lang={l} />
                    ))}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card className="gap-3 rounded-xl border-[#CFC5BE] bg-[#FFF4DC] p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#B23A1E]/10 text-[#B23A1E]">
                  <Icon name="shield-lock" size={14} />
                </span>
                <h3 className="font-heading text-base font-semibold text-[#4A2F1A]">
                  {t("monitoring.antiAi.title")}
                </h3>
              </div>
              <p className="text-sm text-[#79695E]">
                {t("monitoring.antiAi.desc")}{" "}
                <span className="font-medium text-[#4A2F1A]">
                  {Math.round((settings?.autoApproveThreshold ?? 0) * 100)}%
                </span>{" "}
                {t("monitoring.antiAi.never")}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: "Voice", icon: "comment-discussion" },
                  { label: "Rewrite", icon: "pencil" },
                  { label: "Coherence", icon: "check" },
                  { label: "Score", icon: "graph" },
                ].map((stage) => (
                  <div
                    key={stage.label}
                    className="flex flex-col items-center gap-1 rounded-md border border-[#CFC5BE] bg-[#FFE4B5] py-2 text-center"
                  >
                    <Icon name={stage.icon} size={14} className="text-[#C65D00]" />
                    <span className="text-[10px] font-medium text-[#79695E]">
                      {stage.label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
