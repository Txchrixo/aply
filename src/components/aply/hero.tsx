"use client";
/**
 * Hero · headline + subhead + 4 stat cards + 3-step "how it works" row.
 * Uses i18n for all visible strings.
 */
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/aply/icon";
import { useI18n } from "@/components/aply/i18n";
import type { Stats } from "@/components/aply/types";
import { cn } from "@/lib/utils";

interface HeroProps {
  stats: Stats | null;
  loading: boolean;
}

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  highlight?: boolean;
  index: number;
}

function StatCard({ icon, label, value, highlight, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 * index }}
    >
      <Card
        className={cn(
          "gap-3 rounded-xl border-[#CFC5BE] bg-[#FFF4DC] p-5 shadow-sm transition-shadow hover:shadow-md",
          highlight && value > 0 && "border-[#C65D00]/40 ring-1 ring-[#C65D00]/20"
        )}
      >
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              highlight && value > 0
                ? "bg-[#C65D00] text-[#FFE4B5]"
                : "bg-[#FFE4B5] text-[#C65D00]"
            )}
          >
            <Icon name={icon} size={18} />
          </span>
          {highlight && value > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C65D00]">
              <Icon name="bell" size={12} />
              <span className="hidden sm:inline">Action needed</span>
            </span>
          )}
        </div>
        <div>
          <div className="font-heading text-3xl font-semibold text-[#4A2F1A]">
            {value.toLocaleString()}
          </div>
          <div className="text-sm text-[#79695E]">{label}</div>
        </div>
      </Card>
    </motion.div>
  );
}

export function Hero({ stats, loading }: HeroProps) {
  const { t } = useI18n();

  const STEPS: Array<{ icon: string; title: string; subtitle: string }> = [
    {
      icon: "search",
      title: t("hero.step1.title"),
      subtitle: t("hero.step1.subtitle"),
    },
    {
      icon: "pencil",
      title: t("hero.step2.title"),
      subtitle: t("hero.step2.subtitle"),
    },
    {
      icon: "comment-discussion",
      title: t("hero.step3.title"),
      subtitle: t("hero.step3.subtitle"),
    },
  ];

  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden px-4 py-16 md:px-6 md:py-24"
    >
      {/* soft warm glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 0%, rgba(255,159,28,0.18) 0%, transparent 60%), radial-gradient(50% 40% at 10% 20%, rgba(198,93,0,0.10) 0%, transparent 55%)",
        }}
      />
      <div className="mx-auto w-full max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#CFC5BE] bg-[#FFF4DC] px-3 py-1 text-xs font-medium text-[#79695E]">
            <Icon name="zap" size={12} className="text-[#C65D00]" />
            {t("hero.badge")}
          </span>
          <h1
            id="hero-heading"
            className="mt-5 font-heading text-4xl font-semibold leading-[1.08] text-[#4A2F1A] md:text-6xl"
          >
            {t("hero.title.1")}{" "}
            <span className="text-[#C65D00]">{t("hero.title.2")}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#79695E]">
            {t("hero.subtitle")}
          </p>
        </motion.div>

        {/* Stat cards */}
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {loading || !stats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-32 rounded-xl border border-[#CFC5BE] bg-[#FFF4DC]"
              />
            ))
          ) : (
            <>
              <StatCard
                index={0}
                icon="globe"
                label={t("hero.stat.platforms")}
                value={stats.platformsEnabled}
              />
              <StatCard
                index={1}
                icon="bell"
                label={t("hero.stat.pending")}
                value={stats.pendingApprovals}
                highlight
              />
              <StatCard
                index={2}
                icon="pulse"
                label={t("hero.stat.offers")}
                value={stats.newOffers}
              />
              <StatCard
                index={3}
                icon="check"
                label={t("hero.stat.submitted")}
                value={stats.submittedTotal}
              />
            </>
          )}
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-10 grid grid-cols-1 gap-4 rounded-2xl border border-[#CFC5BE] bg-[#FFF4DC]/70 p-5 md:grid-cols-3 md:p-6"
        >
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFE4B5] text-[#C65D00]">
                <Icon name={s.icon} size={16} />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#79695E]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-heading text-base font-semibold text-[#4A2F1A]">
                    {s.title}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-[#79695E]">{s.subtitle}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
