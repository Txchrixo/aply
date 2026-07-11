"use client";
/**
 * ComparisonView · select 2 pending applications and compare their
 * cover letters, quality scores, and job details side-by-side.
 * Helps users decide which draft to submit.
 */
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/components/aply/icon";
import { useI18n } from "@/components/aply/i18n";
import {
  ContractBadge,
  LangBadge,
  QualityRing,
  StatusBadge,
} from "@/components/aply/badges";
import type {
  Application,
  ApplicationListResponse,
} from "@/components/aply/types";
import { apiFetch, initials, logoColor } from "@/components/aply/utils";
import { cn } from "@/lib/utils";

export function ComparisonView() {
  const { t } = useI18n();
  const [pending, setPending] = useState<Application[]>([]);
  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<ApplicationListResponse>(
        "/api/applications?status=pending_approval&pageSize=20"
      );
      setPending(res.items);
      if (res.items.length >= 2) {
        setLeftId(res.items[0].id);
        setRightId(res.items[1].id);
      } else if (res.items.length === 1) {
        setLeftId(res.items[0].id);
      }
    } catch {
      toast.error("Failed to load applications for comparison");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const leftApp = pending.find((a) => a.id === leftId);
  const rightApp = pending.find((a) => a.id === rightId);

  const handleApprove = async (id: string) => {
    try {
      await apiFetch(`/api/applications/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ channel: "dashboard" }),
      });
      toast.success(t("approvals.approved"));
      load();
    } catch {
      toast.error("Failed to approve");
    }
  };

  if (loading) {
    return (
      <Card className="rounded-xl border-border bg-card p-6 dark:bg-[#3A2417]">
        <p className="text-sm text-muted-foreground dark:text-[#C9B89F]">
          {t("common.loading")}
        </p>
      </Card>
    );
  }

  if (pending.length < 2) {
    return null; // Don't render if we can't compare
  }

  return (
    <Card className="gap-4 rounded-xl border-[#C65D00]/30 bg-card p-5 shadow-sm dark:bg-[#3A2417]">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-primary dark:bg-accent/20 dark:text-[#FF9F1C]">
          <Icon name="diff" size={16} />
        </span>
        <div>
          <h3 className="font-heading text-base font-semibold text-foreground dark:text-primary-foreground">
            {t("comparison.title")}
          </h3>
          <p className="text-xs text-muted-foreground dark:text-[#C9B89F]">
            {t("comparison.desc")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Left column */}
        <ComparisonColumn
          apps={pending}
          selectedId={leftId}
          onSelect={setLeftId}
          app={leftApp}
          onApprove={handleApprove}
          label={t("comparison.left")}
          accent="#C65D00"
        />

        {/* Right column */}
        <ComparisonColumn
          apps={pending}
          selectedId={rightId}
          onSelect={setRightId}
          app={rightApp}
          onApprove={handleApprove}
          label={t("comparison.right")}
          accent="#FF9F1C"
        />
      </div>

      {/* Comparison stats */}
      {leftApp && rightApp && (
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 dark:border-[#5A3D26] md:grid-cols-4">
          <ComparisonStat
            label={t("comparison.quality")}
            left={leftApp.qualityScore ?? 0}
            right={rightApp.qualityScore ?? 0}
            format="percent"
          />
          <ComparisonStat
            label={t("comparison.length")}
            left={(leftApp.coverLetter ?? "").length}
            right={(rightApp.coverLetter ?? "").length}
            format="number"
          />
          <ComparisonStat
            label={t("comparison.words")}
            left={(leftApp.coverLetter ?? "").split(/\s+/).length}
            right={(rightApp.coverLetter ?? "").split(/\s+/).length}
            format="number"
          />
          <ComparisonStat
            label={t("comparison.language")}
            left={leftApp.language ?? "-"}
            right={rightApp.language ?? "-"}
            format="text"
          />
        </div>
      )}
    </Card>
  );
}

function ComparisonColumn({
  apps,
  selectedId,
  onSelect,
  app,
  onApprove,
  label,
  accent,
}: {
  apps: Application[];
  selectedId: string;
  onSelect: (id: string) => void;
  app: Application | undefined;
  onApprove: (id: string) => Promise<void>;
  label: string;
  accent: string;
}) {
  const { t } = useI18n();
  const job = app?.jobOffer;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-[#C9B89F]">
          {label}
        </span>
        <Select value={selectedId} onValueChange={onSelect}>
          <SelectTrigger className="ml-auto h-7 w-auto min-w-[8rem] border-border bg-background text-xs dark:border-[#5A3D26] dark:bg-[#4A2F1A]">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent className="bg-card dark:bg-[#3A2417]">
            {apps.map((a) => (
              <SelectItem
                key={a.id}
                value={a.id}
                className="text-xs text-foreground dark:text-primary-foreground"
              >
                {a.jobOffer.title.slice(0, 40)}
                {a.jobOffer.title.length > 40 ? "…" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AnimatePresence mode="wait">
        {app && job ? (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 dark:border-[#5A3D26] dark:bg-[#4A2F1A]"
          >
            {/* Job header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-primary-foreground"
                  style={{ backgroundColor: logoColor(job.company ?? job.title) }}
                  aria-hidden
                >
                  {initials(job.company ?? job.title)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground dark:text-primary-foreground">
                    {job.company ?? "-"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground dark:text-[#C9B89F]">
                    {job.platform?.name ?? ""}
                  </p>
                </div>
              </div>
              <QualityRing score={app.qualityScore ?? 0} />
            </div>

            {/* Title + badges */}
            <div>
              <p className="font-heading text-sm font-semibold text-foreground dark:text-primary-foreground">
                {job.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <StatusBadge status={app.status} />
                {job.contractType && <ContractBadge type={job.contractType} />}
                {app.language && <LangBadge lang={app.language} />}
              </div>
            </div>

            {/* Cover letter */}
            <ScrollArea className="h-40 rounded-md border border-border bg-card dark:border-[#5A3D26] dark:bg-[#3A2417]">
              <pre className="whitespace-pre-wrap p-3 text-xs leading-relaxed text-foreground dark:text-primary-foreground">
                {app.coverLetter || "(empty)"}
              </pre>
            </ScrollArea>

            {/* Approve */}
            <Button
              onClick={() => onApprove(app.id)}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-accent hover:text-foreground"
            >
              <Icon name="check" size={12} />
              {t("approvals.approve")}
            </Button>
          </motion.div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground dark:border-[#5A3D26] dark:text-[#C9B89F]">
            {t("comparison.selectApp")}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ComparisonStat({
  label,
  left,
  right,
  format,
}: {
  label: string;
  left: number | string;
  right: number | string;
  format: "number" | "percent" | "text";
}) {
  const formatVal = (v: number | string) => {
    if (format === "percent") return `${Math.round(Number(v) * 100)}%`;
    if (format === "number") return Number(v).toLocaleString();
    return String(v);
  };

  const leftWins =
    format !== "text" && Number(left) > Number(right) ? true : false;
  const rightWins =
    format !== "text" && Number(right) > Number(left) ? true : false;

  return (
    <div className="text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-[#C9B89F]">
        {label}
      </p>
      <div className="mt-1 flex items-center justify-center gap-3">
        <span
          className={cn(
            "font-heading text-base font-semibold",
            leftWins ? "text-[#2ea043]" : "text-foreground dark:text-primary-foreground"
          )}
        >
          {formatVal(left)}
        </span>
        <span className="text-[#CFC5BE]">vs</span>
        <span
          className={cn(
            "font-heading text-base font-semibold",
            rightWins ? "text-[#2ea043]" : "text-foreground dark:text-primary-foreground"
          )}
        >
          {formatVal(right)}
        </span>
      </div>
    </div>
  );
}
