"use client";
/**
 * Compact overview strip — operational KPIs, not marketing hero.
 */
import { Icon } from "@/components/aply/icon";
import { useI18n } from "@/components/aply/i18n";
import { useDashNav } from "@/components/aply/dashboard-nav";
import type { Stats } from "@/components/aply/types";
import { cn } from "@/lib/utils";

export function DashboardOverviewBar({
  stats,
  loading,
}: {
  stats: Stats | null;
  loading: boolean;
}) {
  const { t } = useI18n();
  const { setView } = useDashNav();

  const items = [
    {
      key: "platforms",
      icon: "globe",
      label: t("hero.stat.platforms"),
      value: stats?.platformsEnabled ?? 0,
      onClick: () => setView("platforms"),
    },
    {
      key: "pending",
      icon: "bell",
      label: t("hero.stat.pending"),
      value: stats?.pendingApprovals ?? 0,
      highlight: (stats?.pendingApprovals ?? 0) > 0,
      onClick: () => setView("approvals"),
    },
    {
      key: "offers",
      icon: "briefcase",
      label: t("hero.stat.offers"),
      value: stats?.newOffers ?? 0,
      onClick: () => setView("offers"),
    },
    {
      key: "submitted",
      icon: "check",
      label: t("hero.stat.submitted"),
      value: stats?.submittedTotal ?? 0,
      onClick: () => setView("history"),
    },
  ];

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onClick}
          className={cn(
            "rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40",
            item.highlight && "border-primary/35 bg-primary/5"
          )}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Icon
              name={item.icon}
              size={12}
              className={item.highlight ? "text-primary" : undefined}
            />
            {item.label}
          </div>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-foreground">
            {loading ? "—" : item.value.toLocaleString()}
          </p>
        </button>
      ))}
    </div>
  );
}
