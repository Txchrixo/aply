"use client";
/**
 * OffersSection · dedicated page to browse / filter / act on detected job offers.
 * Mirrors PlatformsSection density: search, filters, pagination, list rows.
 */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/components/aply/icon";
import { SectionHeading } from "@/components/aply/section-heading";
import { PlatformLogo } from "@/components/aply/platform-logo";
import { Pagination } from "@/components/aply/pagination";
import {
  CategoryBadge,
  ContractBadge,
  LangBadge,
  StatusBadge,
} from "@/components/aply/badges";
import type { JobListResponse, JobOffer } from "@/components/aply/types";
import { apiFetch, relativeTime } from "@/components/aply/utils";
import { useI18n } from "@/components/aply/i18n";
import { useDashNav } from "@/components/aply/dashboard-nav";
import { resolveOfferLogo } from "@/lib/offer-logo";
import { cn } from "@/lib/utils";

const STATUS_VALUES = [
  "all",
  "new",
  "importing",
  "pending_approval",
  "applied",
  "rejected",
] as const;

const SOURCE_VALUES = ["all", "career_page", "job_board"] as const;

function OfferRow({
  offer,
  onPrepare,
  onReview,
}: {
  offer: JobOffer;
  onPrepare: (id: string) => void;
  onReview: () => void;
}) {
  const { t } = useI18n();
  const logo = resolveOfferLogo(offer);
  const importing =
    offer.status === "importing" ||
    (offer.importProgress != null && offer.importProgress < 100);

  return (
    <li className="flex flex-col gap-3 px-3 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center">
      {logo.logoUrl ? (
        <PlatformLogo
          url={logo.logoUrl}
          name={logo.logoLabel ?? undefined}
          size={36}
          className="rounded-lg border border-border bg-card"
        />
      ) : (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground"
          aria-hidden
        >
          <Icon name="globe" size={16} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-foreground">{offer.title}</p>
          {offer.platform?.category ? (
            <CategoryBadge category={offer.platform.category} />
          ) : null}
          {offer.applicationSource === "career_page" ? (
            <span className="inline-flex items-center rounded border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
              {t("monitoring.careerPage")}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {offer.applicationSource === "career_page" ? (
            <span className="font-medium text-foreground/80">
              {offer.company?.trim() || t("monitoring.unknownCompany")}
            </span>
          ) : (
            <>
              <span className="font-medium text-foreground/80">
                {offer.platform?.name ?? t("monitoring.unknownPlatform")}
              </span>
              {" · "}
              {offer.company?.trim() || t("monitoring.unknownCompany")}
            </>
          )}
          {offer.applicationSource === "career_page" && offer.platform?.name
            ? ` · ${t("approvals.via")} ${offer.platform.name}`
            : ""}
          {offer.location ? ` · ${offer.location}` : ""}
          {offer.salary ? ` · ${offer.salary}` : ""}
          {" · "}
          {relativeTime(offer.detectedAt)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {offer.language ? <LangBadge lang={offer.language} /> : null}
        {offer.contractType ? <ContractBadge type={offer.contractType} /> : null}
        {importing ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            <Icon name="sync" size={10} className="animate-spin" />
            Importing
          </span>
        ) : (
          <StatusBadge status={offer.status} />
        )}
        {offer.url ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground"
            asChild
          >
            <a href={offer.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              <Icon name="link-external" size={12} />
            </a>
          </Button>
        ) : null}
        {importing ? (
          <Button size="sm" disabled className="h-7 gap-1 px-2.5 text-xs opacity-60">
            <Icon name="sync" size={12} className="animate-spin" />
            {t("monitoring.prepare")}
          </Button>
        ) : offer.status === "new" ? (
          <Button
            size="sm"
            onClick={() => onPrepare(offer.id)}
            className="h-7 gap-1 bg-primary px-2.5 text-xs text-primary-foreground hover:bg-accent"
          >
            <Icon name="rocket" size={12} />
            {t("monitoring.prepare")}
          </Button>
        ) : offer.status === "pending_approval" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onReview}
            className="h-7 gap-1 border-primary px-2.5 text-xs text-primary"
          >
            <Icon name="eye" size={12} />
            {t("monitoring.review")}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function OffersSection() {
  const { t } = useI18n();
  const { setView } = useDashNav();
  const [items, setItems] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (status !== "all") params.set("status", status);
      if (source !== "all") params.set("source", source);
      if (search.trim()) params.set("q", search.trim());

      const res = await apiFetch<JobListResponse>(`/api/jobs?${params}`);
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("offers.toast.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [page, status, source, search, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      setSearch(q);
    }, 280);
    return () => clearTimeout(id);
  }, [q]);

  const handlePrepare = async (jobOfferId: string) => {
    try {
      toast.loading(t("offers.preparing"), { id: "prepare" });
      await apiFetch("/api/applications", {
        method: "POST",
        body: JSON.stringify({ jobOfferId }),
      });
      toast.success(t("offers.prepared"), { id: "prepare" });
      load();
      setView("approvals");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("offers.toast.prepareFailed"),
        { id: "prepare" }
      );
    }
  };

  const summary =
    total === 0
      ? t("offers.empty.summary")
      : t("offers.summary")
          .replace("{count}", String(total))
          .replace("{page}", String(page))
          .replace("{pages}", String(totalPages));

  return (
    <section
      id="offers"
      aria-labelledby="offers-heading"
      className="aply-panel px-0 py-0"
    >
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          id="offers-heading"
          eyebrow={t("offers.eyebrow")}
          title={t("offers.title")}
          subtitle={t("offers.subtitle")}
        />

        <div className="mt-6 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Icon
                name="search"
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("offers.search")}
                className="h-9 bg-card pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setPage(1);
                setStatus(v);
              }}
            >
              <SelectTrigger className="h-9 w-full bg-card sm:w-[11rem]">
                <SelectValue placeholder={t("offers.filter.status")} />
              </SelectTrigger>
              <SelectContent>
                {STATUS_VALUES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`offers.status.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={source}
              onValueChange={(v) => {
                setPage(1);
                setSource(v);
              }}
            >
              <SelectTrigger className="h-9 w-full bg-card sm:w-[11rem]">
                <SelectValue placeholder={t("offers.filter.source")} />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_VALUES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`offers.source.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            summary={summary}
            align="between"
          />

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <ul className={cn("divide-y divide-border", loading && "opacity-70")}>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3 px-3 py-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </li>
                ))
              ) : items.length === 0 ? (
                <li className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                  <Icon name="inbox" size={22} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t("offers.empty")}</p>
                </li>
              ) : (
                items.map((offer) => (
                  <OfferRow
                    key={offer.id}
                    offer={offer}
                    onPrepare={handlePrepare}
                    onReview={() => setView("approvals")}
                  />
                ))
              )}
            </ul>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            align="end"
          />
        </div>
      </div>
    </section>
  );
}
