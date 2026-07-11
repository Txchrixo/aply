"use client";
/**
 * Hero - headline + integrated stat strip + how-it-works flow.
 * Refined design: no bordered cards, uses color blocks and spacing.
 */
import { motion } from "framer-motion";
import { Icon } from "@/components/aply/icon";
import { useI18n } from "@/components/aply/i18n";
import type { Stats } from "@/components/aply/types";
import { cn } from "@/lib/utils";

interface HeroProps {
  stats: Stats | null;
  loading: boolean;
}

interface StatItemProps {
  icon: string;
  label: string;
  value: number;
  highlight?: boolean;
  index: number;
}

function StatItem({ icon, label, value, highlight, index }: StatItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.08 * index }}
      className={cn(
        "flex flex-col gap-1 px-4 py-3 sm:px-6 sm:py-4",
        highlight && value > 0 && "relative"
      )}
    >
      {highlight && value > 0 && (
        <span className="absolute right-2 top-2 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
      )}
      <div className="flex items-center gap-2">
        <Icon
          name={icon}
          size={14}
          className={highlight && value > 0 ? "text-primary" : "text-muted-foreground"}
        />
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <span className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
        {value.toLocaleString()}
      </span>
    </motion.div>
  );
}

export function Hero({ stats, loading }: HeroProps) {
  const { t } = useI18n();

  const STEPS: Array<{ icon: string; title: string; subtitle: string }> = [
    { icon: "search", title: t("hero.step1.title"), subtitle: t("hero.step1.subtitle") },
    { icon: "pencil", title: t("hero.step2.title"), subtitle: t("hero.step2.subtitle") },
    { icon: "comment-discussion", title: t("hero.step3.title"), subtitle: t("hero.step3.subtitle") },
  ];

  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden px-4 pt-12 pb-8 md:px-6 md:pt-20 md:pb-12"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50% 40% at 85% 0%, rgba(255,159,28,0.12) 0%, transparent 55%), radial-gradient(40% 30% at 15% 15%, rgba(198,93,0,0.08) 0%, transparent 50%)",
        }}
      />
      <div className="mx-auto w-full max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Icon name="zap" size={11} className="text-primary" />
            {t("hero.badge")}
          </span>
          <h1
            id="hero-heading"
            className="mt-4 font-heading text-3xl font-semibold leading-[1.1] text-foreground sm:text-4xl md:text-5xl lg:text-6xl"
          >
            {t("hero.title.1")}{" "}
            <span className="aply-gradient-text">{t("hero.title.2")}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("hero.subtitle")}
          </p>
        </motion.div>

        {/* Stats strip - no cards, just dividers */}
        <div className="mt-8 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl bg-card sm:grid-cols-4 sm:divide-y-0 md:mt-10">
          {loading || !stats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse bg-muted/50" />
            ))
          ) : (
            <>
              <StatItem index={0} icon="globe" label={t("hero.stat.platforms")} value={stats.platformsEnabled} />
              <StatItem index={1} icon="bell" label={t("hero.stat.pending")} value={stats.pendingApprovals} highlight />
              <StatItem index={2} icon="pulse" label={t("hero.stat.offers")} value={stats.newOffers} />
              <StatItem index={3} icon="check" label={t("hero.stat.submitted")} value={stats.submittedTotal} />
            </>
          )}
        </div>

        {/* How it works - horizontal flow, not boxes */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-0"
        >
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex items-center gap-3 sm:flex-1">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon name={s.icon} size={15} />
                </span>
                <div>
                  <span className="font-heading text-sm font-semibold text-foreground">
                    {s.title}
                  </span>
                  <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <Icon
                  name="arrow-right"
                  size={16}
                  className="ml-auto hidden text-border sm:block"
                />
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
