"use client";
/**
 * ApprovalsSection · pending approval cards with approve / reject / regenerate / notify.
 */
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icon } from "@/components/aply/icon";
import { SectionHeading } from "@/components/aply/section-heading";
import { ComparisonView } from "@/components/aply/comparison-view";
import {
  ContractBadge,
  LangBadge,
  QualityRing,
  StatusBadge,
} from "@/components/aply/badges";
import type {
  Application,
  ApplicationListResponse,
  GenerateResponse,
  NotificationResponse,
} from "@/components/aply/types";
import { apiFetch, initials, logoColor, truncate } from "@/components/aply/utils";
import { useI18n } from "@/components/aply/i18n";

interface ApprovalsSectionProps {
  onApprove: () => void;
}

interface ApprovalCardProps {
  app: Application;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onRegenerate: (jobOfferId: string, appId: string) => Promise<void>;
  onNotify: (appId: string, channel: "email" | "whatsapp") => Promise<void>;
}

const SKILL_RE: RegExp = /\b(React|Next\.?js|TypeScript|JavaScript|Node\.?js|Python|PostgreSQL|MySQL|GraphQL|REST|Tailwind|Prisma|AWS|Docker|Kubernetes|Redis|Vue|Angular|Svelte|Go|Java|Rust|Figma|Sketch)\b/gi;

function inferSkills(text: string | null | undefined, existing?: string[] | null): string[] {
  if (existing && existing.length > 0) return existing;
  if (!text) return [];
  const found = new Set<string>();
  const m = text.match(SKILL_RE);
  if (m) for (const s of m) found.add(s);
  return Array.from(found).slice(0, 8);
}

function ApprovalCard({
  app,
  onApprove,
  onReject,
  onRegenerate,
  onNotify,
}: ApprovalCardProps) {
  const { t } = useI18n();
  const [busy, setBusy] = useState<"approve" | "reject" | "regen" | "email" | "whatsapp" | null>(null);
  const [cover, setCover] = useState<string>(app.coverLetter ?? "");
  const [quality, setQuality] = useState<number>(app.qualityScore ?? 0);

  useEffect(() => {
    setCover(app.coverLetter ?? "");
    setQuality(app.qualityScore ?? 0);
  }, [app.coverLetter, app.qualityScore]);

  const job = app.jobOffer;
  const skills = inferSkills(cover);

  const run = async (
    kind: "approve" | "reject" | "regen" | "email" | "whatsapp",
    fn: () => Promise<void>
  ) => {
    setBusy(kind);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.3 }}
    >
      <Card className="gap-4 rounded-xl border-[#CFC5BE] bg-[#FFF4DC] p-5 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-[#FFE4B5]"
                style={{ backgroundColor: logoColor(job.company ?? job.title) }}
                aria-hidden
              >
                {initials(job.company ?? job.title)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#4A2F1A]">
                  {job.company ?? "-"}
                </p>
                <p className="truncate text-xs text-[#79695E]">
                  {t("approvals.via")} {job.platform?.name ?? t("approvals.unknownPlatform")}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={app.status} />
            <QualityRing score={quality} />
          </div>
        </div>

        {/* Job title + meta */}
        <div>
          <h3 className="font-heading text-lg font-semibold leading-tight text-[#4A2F1A]">
            {job.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-[#79695E]">
            {job.location && <span>{job.location}</span>}
            {job.salary && <span>· {job.salary}</span>}
            {job.contractType && (
              <>
                <span>·</span>
                <ContractBadge type={job.contractType} />
              </>
            )}
            {app.language && (
              <>
                <span>·</span>
                <LangBadge lang={app.language} />
              </>
            )}
          </div>
        </div>

        {/* Cover letter */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#79695E]">
              {t("approvals.coverLetter")}
            </span>
            <span className="text-[11px] text-[#79695E]">
              {cover.length.toLocaleString()} {t("approvals.chars")}
            </span>
          </div>
          <ScrollArea className="h-40 rounded-md border border-[#CFC5BE] bg-[#FFE4B5]">
            <pre className="whitespace-pre-wrap p-3 text-sm leading-relaxed text-[#4A2F1A]">
              {cover || t("approvals.empty.placeholder")}
            </pre>
          </ScrollArea>
        </div>

        {/* Detected skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#79695E]">
              {t("approvals.skills")}
            </span>
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded border border-[#CFC5BE] bg-[#FFE4B5] px-1.5 py-0.5 text-[11px] font-medium text-[#4A2F1A]"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[#CFC5BE] pt-4">
          <Button
            onClick={() => run("approve", () => onApprove(app.id))}
            disabled={busy !== null}
            className="bg-[#C65D00] text-[#FFE4B5] hover:bg-[#FF9F1C] hover:text-[#4A2F1A]"
          >
            {busy === "approve" ? (
              <Icon name="sync" size={14} className="animate-spin" />
            ) : (
              <Icon name="check" size={14} />
            )}
            {t("approvals.approve")}
          </Button>
          <Button
            variant="outline"
            onClick={() => run("reject", () => onReject(app.id))}
            disabled={busy !== null}
            className="border-[#B23A1E] text-[#B23A1E] hover:bg-[#B23A1E]/10 hover:text-[#B23A1E]"
          >
            {busy === "reject" ? (
              <Icon name="sync" size={14} className="animate-spin" />
            ) : (
              <Icon name="x" size={14} />
            )}
            {t("approvals.reject")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => run("regen", () => onRegenerate(job.id, app.id))}
            disabled={busy !== null}
            className="text-[#79695E] hover:bg-[#FFE4B5] hover:text-[#C65D00]"
          >
            {busy === "regen" ? (
              <Icon name="sync" size={14} className="animate-spin" />
            ) : (
              <Icon name="sync" size={14} />
            )}
            {t("approvals.regenerate")}
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => run("whatsapp", () => onNotify(app.id, "whatsapp"))}
              disabled={busy !== null}
              aria-label={t("approvals.whatsapp")}
              className="h-9 w-9 text-[#79695E] hover:bg-[#FFE4B5] hover:text-[#C65D00]"
            >
              {busy === "whatsapp" ? (
                <Icon name="sync" size={14} className="animate-spin" />
              ) : (
                <Icon name="comment-discussion" size={16} />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => run("email", () => onNotify(app.id, "email"))}
              disabled={busy !== null}
              aria-label={t("approvals.email")}
              className="h-9 w-9 text-[#79695E] hover:bg-[#FFE4B5] hover:text-[#C65D00]"
            >
              {busy === "email" ? (
                <Icon name="sync" size={14} className="animate-spin" />
              ) : (
                <Icon name="mail" size={16} />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function ApprovalsSection({ onApprove }: ApprovalsSectionProps) {
  const { t } = useI18n();
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<ApplicationListResponse>(
        "/api/applications?status=pending_approval&pageSize=20"
      );
      setItems(res.items);
    } catch (e) {
      toast.error(t("approvals.toast.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id: string) => {
    await apiFetch(`/api/applications/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ channel: "dashboard" }),
    });
    toast.success(t("approvals.toast.approved"));
    setItems((prev) => prev.filter((a) => a.id !== id));
    onApprove();
  };

  const handleReject = async (id: string) => {
    await apiFetch(`/api/applications/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    toast.success(t("approvals.toast.rejected"));
    setItems((prev) => prev.filter((a) => a.id !== id));
  };

  const handleRegenerate = async (jobOfferId: string, appId: string) => {
    toast.loading(t("approvals.toast.regenLoading"), { id: `regen-${appId}` });
    const res = await apiFetch<GenerateResponse>("/api/generate", {
      method: "POST",
      body: JSON.stringify({ jobOfferId }),
    });
    setItems((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              coverLetter: res.coverLetter,
              qualityScore: res.qualityScore,
            }
          : a
      )
    );
    toast.success(
      t("approvals.toast.regenReady").replace(
        "{percent}",
        String(Math.round(res.qualityScore * 100))
      ),
      { id: `regen-${appId}` }
    );
  };

  const handleNotify = async (
    appId: string,
    channel: "email" | "whatsapp"
  ) => {
    const res = await apiFetch<NotificationResponse>("/api/notifications", {
      method: "POST",
      body: JSON.stringify({ applicationId: appId, channel }),
    });
    toast.success(
      channel === "email"
        ? t("approvals.toast.emailed")
        : t("approvals.toast.whatsapped"),
      {
        description: truncate(res.preview.body, 120),
      }
    );
  };

  return (
    <section
      id="approvals"
      aria-labelledby="approvals-heading"
      className="bg-[#FFF4DC]/60 px-4 py-12 md:px-6 md:py-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          id="approvals-heading"
          eyebrow={t("approvals.eyebrow")}
          title={t("approvals.title")}
          subtitle={t("approvals.subtitle")}
        />

        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-80 rounded-xl border border-[#CFC5BE] bg-[#FFF4DC]"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#CFC5BE] bg-[#FFF4DC] px-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2ea043]/12 text-[#2ea043]">
                <Icon name="check" size={24} />
              </span>
              <div>
                <p className="font-heading text-lg font-semibold text-[#4A2F1A]">
                  {t("approvals.empty.title")}
                </p>
                <p className="text-sm text-[#79695E]">
                  {t("approvals.empty.desc")}
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="border-[#C65D00] text-[#C65D00] hover:bg-[#FFE4B5]"
              >
                <a href="#history">
                  <Icon name="history" size={14} />
                  {t("approvals.empty.history")}
                </a>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {items.map((app) => (
                <ApprovalCard
                  key={app.id}
                  app={app}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onRegenerate={handleRegenerate}
                  onNotify={handleNotify}
                />
              ))}
            </div>
          )}

          {/* Comparison view · only shows when 2+ pending */}
          {items.length >= 2 && <ComparisonView />}
        </div>
      </div>
    </section>
  );
}
