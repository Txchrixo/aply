"use client";
/**
 * HistorySection · table of submitted + rejected applications.
 * Rows are clickable → opens ApplicationDetailDrawer.
 * Includes a CSV export button.
 */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icon } from "@/components/aply/icon";
import { SectionHeading } from "@/components/aply/section-heading";
import { ApplicationDetailDrawer } from "@/components/aply/application-detail-drawer";
import {
  LangBadge,
  QualityRing,
  StatusBadge,
} from "@/components/aply/badges";
import type {
  Application,
  ApplicationListResponse,
} from "@/components/aply/types";
import { apiFetch, relativeTime } from "@/components/aply/utils";
import { useI18n } from "@/components/aply/i18n";

interface HistoryRow {
  id: string;
  date: string;
  title: string;
  company: string | null;
  platform: string | null;
  language: string | null;
  quality: number | null;
  status: string;
}

export function HistorySection() {
  const { t } = useI18n();
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [submitted, rejected] = await Promise.all([
        apiFetch<ApplicationListResponse>(
          "/api/applications?status=submitted&pageSize=20"
        ),
        apiFetch<ApplicationListResponse>(
          "/api/applications?status=rejected&pageSize=20"
        ),
      ]);
      const merged: HistoryRow[] = [...submitted.items, ...rejected.items]
        .map((a: Application) => ({
          id: a.id,
          date: a.submittedAt ?? a.updatedAt ?? a.createdAt,
          title: a.jobOffer?.title ?? "-",
          company: a.jobOffer?.company ?? null,
          platform: a.jobOffer?.platform?.name ?? null,
          language: a.language ?? a.jobOffer?.language ?? null,
          quality: a.qualityScore,
          status: a.status,
        }))
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        .slice(0, 12);
      setRows(merged);
    } catch (e) {
      toast.error(t("history.toast.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRowClick = (id: string) => {
    setDrawerId(id);
    setDrawerOpen(true);
  };

  const handleExport = () => {
    window.open("/api/export?format=csv", "_blank");
    toast.success("Exporting applications as CSV…");
  };

  return (
    <>
      <section
        id="history"
        aria-labelledby="history-heading"
        className="bg-card/60 px-4 py-12 md:px-6 md:py-16 dark:bg-[#3A2417]/40"
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              id="history-heading"
              eyebrow={t("history.eyebrow")}
              title={t("history.title")}
              subtitle={t("history.subtitle")}
            />
            <Button
              variant="outline"
              onClick={handleExport}
              className="h-9 shrink-0 gap-2 border-[#C65D00] text-primary hover:bg-background dark:border-[#FF9F1C] dark:text-[#FF9F1C] dark:hover:bg-[#4A2F1A]"
            >
              <Icon name="download" size={14} />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          </div>

          <Card className="mt-8 gap-0 overflow-hidden rounded-xl border-border bg-card p-0 dark:bg-[#3A2417]">
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-5 text-muted-foreground dark:text-[#C9B89F]">
                      {t("history.date")}
                    </TableHead>
                    <TableHead className="text-muted-foreground dark:text-[#C9B89F]">
                      {t("history.title_col")}
                    </TableHead>
                    <TableHead className="text-muted-foreground dark:text-[#C9B89F]">
                      {t("history.company")}
                    </TableHead>
                    <TableHead className="hidden text-muted-foreground dark:text-[#C9B89F] md:table-cell">
                      {t("history.platform")}
                    </TableHead>
                    <TableHead className="text-muted-foreground dark:text-[#C9B89F]">
                      {t("history.language")}
                    </TableHead>
                    <TableHead className="text-muted-foreground dark:text-[#C9B89F]">
                      {t("history.quality")}
                    </TableHead>
                    <TableHead className="pr-5 text-right text-muted-foreground dark:text-[#C9B89F]">
                      {t("history.status")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell colSpan={7} className="py-3">
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : rows.length === 0 ? (
                    <TableRow className="border-border">
                      <TableCell colSpan={7} className="py-16">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <div className="relative">
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-primary shadow-sm dark:bg-[#4A2F1A]">
                              <Icon name="inbox" size={22} />
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="font-heading text-base font-semibold text-foreground dark:text-primary-foreground">
                              {t("history.emptyTitle")}
                            </p>
                            <p className="max-w-sm text-sm text-muted-foreground dark:text-[#C9B89F]">
                              {t("history.empty")}
                            </p>
                          </div>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="mt-1 border-[#C65D00] text-primary hover:bg-background dark:border-[#FF9F1C] dark:text-[#FF9F1C]"
                          >
                            <a href="#approvals">
                              <Icon name="inbox" size={12} />
                              {t("history.emptyCta")}
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow
                        key={row.id}
                        onClick={() => handleRowClick(row.id)}
                        className="cursor-pointer border-border transition-colors hover:bg-background/60 dark:hover:bg-[#4A2F1A]/60"
                      >
                        <TableCell className="pl-5 text-xs text-muted-foreground dark:text-[#C9B89F]">
                          {relativeTime(row.date)}
                        </TableCell>
                        <TableCell className="max-w-[18rem] truncate font-medium text-foreground dark:text-primary-foreground">
                          {row.title}
                        </TableCell>
                        <TableCell className="max-w-[12rem] truncate text-foreground dark:text-primary-foreground">
                          {row.company ?? "-"}
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground dark:text-[#C9B89F] md:table-cell">
                          {row.platform ?? "-"}
                        </TableCell>
                        <TableCell>
                          {row.language ? <LangBadge lang={row.language} /> : "-"}
                        </TableCell>
                        <TableCell>
                          {row.quality != null ? (
                            <QualityRing score={row.quality} />
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          <StatusBadge status={row.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </div>
      </section>

      <ApplicationDetailDrawer
        applicationId={drawerId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onApprove={load}
      />
    </>
  );
}
