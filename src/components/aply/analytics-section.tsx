"use client";
/**
 * AnalyticsSection · charts dashboard using Recharts.
 * Shows weekly applications bar chart, status pie, top platforms,
 * quality trend line, contract type + language distribution, and summary KPIs.
 */
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/aply/icon";
import { SectionHeading } from "@/components/aply/section-heading";
import { useI18n } from "@/components/aply/i18n";
import { apiFetch } from "@/components/aply/utils";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  weeklyApplications: Array<{ week: string; submitted: number; rejected: number; pending: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  topPlatforms: Array<{ name: string; count: number }>;
  contractTypeDistribution: Array<{ type: string; count: number }>;
  languageDistribution: Array<{ lang: string; count: number }>;
  qualityTrend: Array<{ date: string; avgScore: number }>;
  summary: {
    total: number;
    submitted: number;
    rejected: number;
    pending: number;
    avgQuality: number;
    responseRate: number;
  };
}

// Warm palette for charts (no blue/indigo)
const CHART_COLORS = ["#C65D00", "#FF9F1C", "#8B4513", "#D2691E", "#A0522D", "#79695E"];
const STATUS_COLORS: Record<string, string> = {
  submitted: "#2ea043",
  pending_approval: "#C65D00",
  draft: "#FF9F1C",
  rejected: "#B23A1E",
  approved: "#2ea043",
};

function ChartCard({
  title,
  icon,
  children,
  className,
  delay = 0,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className={cn("gap-3 rounded-xl border-border bg-card p-5 shadow-sm dark:bg-[#3A2417]", className)}>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-background text-primary dark:bg-[#4A2F1A]">
            <Icon name={icon} size={14} />
          </span>
          <h3 className="font-heading text-sm font-semibold text-foreground dark:text-primary-foreground">
            {title}
          </h3>
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  color,
  delay,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25, delay }}
    >
      <Card className="gap-2 rounded-xl border-border bg-card p-4 shadow-sm dark:bg-[#3A2417]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground dark:text-[#C9B89F]">
            {label}
          </span>
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <Icon name={icon} size={12} />
          </span>
        </div>
        <div className="font-heading text-2xl font-semibold text-foreground dark:text-primary-foreground">
          {value}
        </div>
      </Card>
    </motion.div>
  );
}

// Custom tooltip styled for warm palette
function WarmTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg dark:border-[#5A3D26] dark:bg-[#3A2417]">
      {label && <p className="mb-1 font-medium text-foreground dark:text-primary-foreground">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5 text-muted-foreground dark:text-[#C9B89F]">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-medium text-foreground dark:text-primary-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function AnalyticsSection() {
  const { t } = useI18n();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<AnalyticsData>("/api/analytics");
      setData(d);
    } catch (e) {
      console.error("Failed to load analytics", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <section id="analytics" aria-labelledby="analytics-heading" className="aply-panel px-0 py-0">
        <div className="mx-auto w-full max-w-7xl">
          <SectionHeading
            id="analytics-heading"
            eyebrow={t("analytics.eyebrow")}
            title={t("analytics.title")}
            subtitle={t("analytics.subtitle")}
          />
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl border border-border" />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-xl border border-border" />
            <Skeleton className="h-72 rounded-xl border border-border" />
          </div>
        </div>
      </section>
    );
  }

  if (!data || data.summary.total === 0) {
    return (
      <section id="analytics" aria-labelledby="analytics-heading" className="aply-panel px-0 py-0">
        <div className="mx-auto w-full max-w-7xl">
          <SectionHeading
            id="analytics-heading"
            eyebrow={t("analytics.eyebrow")}
            title={t("analytics.title")}
            subtitle={t("analytics.subtitle")}
          />
          <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-20 text-center dark:bg-[#3A2417]">
            <div className="relative">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background text-primary shadow-sm dark:bg-[#4A2F1A]">
                <Icon name="graph" size={28} />
              </span>
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-foreground">
                !
              </span>
            </div>
            <div className="space-y-1.5">
              <p className="font-heading text-lg font-semibold text-foreground dark:text-primary-foreground">
                {t("analytics.emptyTitle")}
              </p>
              <p className="max-w-md text-sm text-muted-foreground dark:text-[#C9B89F]">
                {t("analytics.empty")}
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-[#C65D00] text-primary hover:bg-background dark:border-[#FF9F1C] dark:text-[#FF9F1C]"
            >
              <a href="#approvals">
                <Icon name="inbox" size={14} />
                {t("analytics.emptyCta")}
              </a>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const s = data.summary;

  return (
    <section id="analytics" aria-labelledby="analytics-heading" className="aply-panel px-0 py-0">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="analytics-heading"
            eyebrow={t("analytics.eyebrow")}
            title={t("analytics.title")}
            subtitle={t("analytics.subtitle")}
          />
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="no-print h-9 shrink-0 gap-2 border-[#8B4513] text-[#8B4513] hover:bg-background dark:border-[#D2691E] dark:text-[#D2691E]"
          >
            <Icon name="download" size={14} />
            <span className="hidden sm:inline">{t("analytics.exportPdf")}</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>

        {/* KPI row */}
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard label={t("analytics.summary.total")} value={s.total} icon="inbox" color="#C65D00" delay={0} />
          <KpiCard label={t("analytics.summary.submitted")} value={s.submitted} icon="check" color="#2ea043" delay={0.05} />
          <KpiCard label={t("analytics.summary.pending")} value={s.pending} icon="bell" color="#FF9F1C" delay={0.1} />
          <KpiCard label={t("analytics.summary.rejected")} value={s.rejected} icon="x" color="#B23A1E" delay={0.15} />
          <KpiCard label={t("analytics.summary.avgQuality")} value={`${Math.round(s.avgQuality * 100)}%`} icon="graph" color="#8B4513" delay={0.2} />
          <KpiCard label={t("analytics.summary.responseRate")} value={`${Math.round(s.responseRate * 100)}%`} icon="pulse" color="#D2691E" delay={0.25} />
        </div>

        {/* Charts grid */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Weekly applications · stacked bar */}
          <ChartCard title={t("analytics.weekly")} icon="graph">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.weeklyApplications} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CFC5BE" strokeOpacity={0.4} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#79695E" }} axisLine={{ stroke: "#CFC5BE" }} />
                <YAxis tick={{ fontSize: 11, fill: "#79695E" }} axisLine={{ stroke: "#CFC5BE" }} allowDecimals={false} />
                <Tooltip content={<WarmTooltip />} cursor={{ fill: "rgba(198,93,0,0.06)" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                <Bar dataKey="submitted" name={t("analytics.submitted")} stackId="a" fill="#2ea043" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pending" name={t("analytics.pending")} stackId="a" fill="#FF9F1C" radius={[0, 0, 0, 0]} />
                <Bar dataKey="rejected" name={t("analytics.rejected")} stackId="a" fill="#B23A1E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Status distribution · pie */}
          <ChartCard title={t("analytics.statusDist")} icon="graph">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={40}
                  paddingAngle={2}
                >
                  {data.statusDistribution.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={STATUS_COLORS[entry.status] ?? CHART_COLORS[i % CHART_COLORS.length]}
                      stroke="#FFF4DC"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<WarmTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  iconType="circle"
                  formatter={(v: string) => (
                    <span className="text-muted-foreground dark:text-[#C9B89F]">{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Quality trend · area line */}
          <ChartCard title={t("analytics.qualityTrend")} icon="pulse">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.qualityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="qualityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C65D00" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#C65D00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#CFC5BE" strokeOpacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#79695E" }} axisLine={{ stroke: "#CFC5BE" }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: "#79695E" }} axisLine={{ stroke: "#CFC5BE" }} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                <Tooltip content={<WarmTooltip />} cursor={{ stroke: "#C65D00", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="avgScore"
                  name="Quality"
                  stroke="#C65D00"
                  strokeWidth={2}
                  fill="url(#qualityGrad)"
                  dot={{ fill: "#C65D00", r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top platforms · horizontal bar */}
          <ChartCard title={t("analytics.topPlatforms")} icon="globe">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                layout="vertical"
                data={data.topPlatforms}
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#CFC5BE" strokeOpacity={0.4} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#79695E" }} axisLine={{ stroke: "#CFC5BE" }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#79695E" }}
                  axisLine={{ stroke: "#CFC5BE" }}
                  width={100}
                />
                <Tooltip content={<WarmTooltip />} cursor={{ fill: "rgba(198,93,0,0.06)" }} />
                <Bar dataKey="count" name="Applications" fill="#C65D00" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Contract types + Languages · small dual cards */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ChartCard title={t("analytics.contractDist")} icon="briefcase" delay={0.1}>
            <div className="flex flex-wrap gap-2">
              {data.contractTypeDistribution.map((c, i) => {
                const max = Math.max(...data.contractTypeDistribution.map((x) => x.count));
                const pct = (c.count / max) * 100;
                return (
                  <div key={c.type} className="flex items-center gap-2">
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-background dark:bg-[#4A2F1A]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground dark:text-[#C9B89F]">
                      {c.type} ({c.count})
                    </span>
                  </div>
                );
              })}
            </div>
          </ChartCard>

          <ChartCard title={t("analytics.langDist")} icon="globe" delay={0.15}>
            <div className="flex items-center gap-4">
              {data.languageDistribution.map((l, i) => (
                <div key={l.lang} className="flex flex-col items-center gap-1">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold uppercase text-primary-foreground"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  >
                    {l.lang}
                  </div>
                  <span className="text-xs font-medium text-foreground dark:text-primary-foreground">{l.count}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </section>
  );
}
