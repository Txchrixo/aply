"use client";
/**
 * PlatformDetailDrawer · slide-in panel showing platform stats + recent offers.
 * Opens when a platform card is clicked.
 */
import { useEffect, useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/aply/icon";
import { useI18n } from "@/components/aply/i18n";
import { hasRssFeed } from "@/lib/rss-feeds";
import {
  CategoryBadge,
  ContractBadge,
  LangBadge,
  PriorityDot,
  StatusBadge,
} from "@/components/aply/badges";
import { apiFetch, relativeTime, initials, logoColor } from "@/components/aply/utils";
import { cn } from "@/lib/utils";

interface PlatformStats {
  platform: {
    id: string;
    name: string;
    url: string;
    category: string;
    languages: string[];
    contractTypes: string[];
    hasLoginRequired: boolean;
    hasAntiBot: boolean;
    priority: string;
    notes: string | null;
    enabled: boolean;
    lastCheckedAt: string | null;
    newOffersCount: number;
  };
  stats: {
    totalOffers: number;
    newOffers: number;
    pendingOffers: number;
    appliedOffers: number;
    totalApplications: number;
  };
  recentOffers: Array<{
    id: string;
    title: string;
    company: string | null;
    location: string | null;
    salary: string | null;
    contractType: string | null;
    language: string | null;
    status: string;
    detectedAt: string;
    url: string;
    hasApplication: boolean;
    applicationStatus: string | null;
    qualityScore: number | null;
  }>;
}

interface PlatformDetailDrawerProps {
  platformId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlatformDetailDrawer({
  platformId,
  open,
  onOpenChange,
}: PlatformDetailDrawerProps) {
  const { t } = useI18n();
  const [data, setData] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!platformId) return;
    setLoading(true);
    try {
      const d = await apiFetch<PlatformStats>(
        `/api/platforms/${platformId}/stats`
      );
      setData(d);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [platformId]);

  useEffect(() => {
    if (open && platformId) load();
  }, [open, platformId, load]);

  const p = data?.platform;
  const s = data?.stats;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-border bg-card p-0 sm:max-w-lg dark:border-[#5A3D26] dark:bg-[#3A2417]"
        aria-describedby={undefined}
      >
        <SheetHeader className="border-b border-border px-6 py-4 dark:border-[#5A3D26]">
          <SheetTitle className="font-heading text-xl font-semibold text-foreground dark:text-primary-foreground">
            {loading ? "Loading…" : p ? p.name : "Platform not found"}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground dark:text-[#C9B89F]">
            {loading
              ? "Fetching platform details"
              : p
              ? p.url.replace(/^https?:\/\//, "")
              : "The platform you're looking for doesn't exist."}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex h-full items-center justify-center p-8">
            <Icon name="sync" size={24} className="animate-spin text-primary" />
          </div>
        ) : !p || !s ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <Icon name="globe" size={32} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Platform not found.</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="space-y-5 px-6 py-5">
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={p.category} />
                <span className="flex items-center gap-1 text-xs text-muted-foreground dark:text-[#C9B89F]">
                  <PriorityDot priority={p.priority} />
                  {p.priority} priority
                </span>
                {p.hasLoginRequired && (
                  <span className="inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground dark:border-[#5A3D26] dark:bg-[#4A2F1A]">
                    <Icon name="shield-lock" size={10} />
                    {t("platforms.login")}
                  </span>
                )}
                {p.hasAntiBot && (
                  <span className="inline-flex items-center gap-1 rounded border border-[#B23A1E]/30 bg-[#B23A1E]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#B23A1E]">
                    <Icon name="alert" size={10} />
                    {t("platforms.antibot")}
                  </span>
                )}
                {hasRssFeed(p.name) && (
                  <span className="inline-flex items-center gap-1 rounded border border-[#FF9F1C]/40 bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-primary dark:border-[#FF9F1C]/50 dark:text-[#FF9F1C]">
                    <Icon name="rss" size={10} />
                    RSS
                  </span>
                )}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
                    p.enabled
                      ? "bg-[#2ea043]/12 text-[#2ea043]"
                      : "bg-[#79695E]/12 text-muted-foreground"
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {p.enabled ? "Active" : "Paused"}
                </span>
              </div>

              {/* Languages + contract types */}
              <div className="flex flex-wrap items-center gap-1.5">
                {p.languages.map((l) => (
                  <LangBadge key={l} lang={l} />
                ))}
                {p.contractTypes.map((c) => (
                  <ContractBadge key={c} type={c} />
                ))}
              </div>

              {p.notes && (
                <div className="rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground dark:border-[#5A3D26] dark:bg-[#4A2F1A] dark:text-[#C9B89F]">
                  <Icon name="info" size={12} className="mr-1 inline" />
                  {p.notes}
                </div>
              )}

              <Separator className="bg-[#CFC5BE] dark:bg-[#5A3D26]" />

              {/* Stats grid */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Icon name="graph" size={12} />
                  {t("platformDrawer.stats")}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <StatBox
                    label={t("platformDrawer.totalOffers")}
                    value={s.totalOffers}
                    color="#C65D00"
                    icon="inbox"
                  />
                  <StatBox
                    label={t("platformDrawer.newOffers")}
                    value={s.newOffers}
                    color="#FF9F1C"
                    icon="pulse"
                  />
                  <StatBox
                    label={t("platformDrawer.pending")}
                    value={s.pendingOffers}
                    color="#8B4513"
                    icon="bell"
                  />
                  <StatBox
                    label={t("platformDrawer.applied")}
                    value={s.appliedOffers}
                    color="#2ea043"
                    icon="check"
                  />
                  <StatBox
                    label={t("platformDrawer.applications")}
                    value={s.totalApplications}
                    color="#D2691E"
                    icon="file"
                  />
                  <StatBox
                    label={t("platformDrawer.lastChecked")}
                    value={p.lastCheckedAt ? relativeTime(p.lastCheckedAt) : "-"}
                    color="#79695E"
                    icon="clock"
                    isText
                  />
                </div>
              </div>

              <Separator className="bg-[#CFC5BE] dark:bg-[#5A3D26]" />

              {/* Recent offers */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Icon name="list-unordered" size={12} />
                  {t("platformDrawer.recentOffers")}
                </h3>
                {data?.recentOffers.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center dark:border-[#5A3D26]">
                    <Icon name="search" size={20} className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground dark:text-[#C9B89F]">
                      {t("platformDrawer.noOffers")}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {data?.recentOffers.map((offer) => (
                      <li
                        key={offer.id}
                        className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-[#C65D00] dark:border-[#5A3D26] dark:bg-[#4A2F1A]"
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold text-primary-foreground"
                          style={{
                            backgroundColor: logoColor(
                              offer.company ?? offer.title
                            ),
                          }}
                          aria-hidden
                        >
                          {initials(offer.company ?? offer.title)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground dark:text-primary-foreground">
                            {offer.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground dark:text-[#C9B89F]">
                            {offer.company ?? "-"}
                            {offer.location ? ` · ${offer.location}` : ""}
                            {offer.salary ? ` · ${offer.salary}` : ""}
                            {" · "}
                            {relativeTime(offer.detectedAt)}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            <StatusBadge status={offer.status} />
                            {offer.contractType && (
                              <ContractBadge type={offer.contractType} />
                            )}
                            {offer.language && (
                              <LangBadge lang={offer.language} />
                            )}
                          </div>
                        </div>
                        <a
                          href={offer.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open offer"
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-primary dark:hover:bg-[#3A2417]"
                        >
                          <Icon name="link-external" size={14} />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Visit platform */}
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-[#C65D00] bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Icon name="link-external" size={14} />
                {t("platformDrawer.visit")}
              </a>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StatBox({
  label,
  value,
  color,
  icon,
  isText,
}: {
  label: string;
  value: number | string;
  color: string;
  icon: string;
  isText?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3 text-center dark:border-[#5A3D26] dark:bg-[#4A2F1A]">
      <span
        className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-md"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <Icon name={icon} size={13} />
      </span>
      <p
        className={cn(
          "font-heading font-semibold text-foreground dark:text-primary-foreground",
          isText ? "text-xs" : "text-xl"
        )}
      >
        {value}
      </p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground dark:text-[#C9B89F]">
        {label}
      </p>
    </div>
  );
}
