"use client";
/**
 * Interactive hero preview that mirrors the live dashboard shell:
 * cocoa sidebar, topbar titles, Overview KPIs, Offers rows, Platforms list
 * (well-known boards with real favicons), and Approvals cards.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/aply/icon";
import { PlatformLogo } from "@/components/aply/platform-logo";
import { cn } from "@/lib/utils";

type PreviewView = "overview" | "approvals" | "offers" | "platforms";

const NAV: Array<{
  icon: string;
  label: string;
  group: "work" | "data" | "setup";
  view?: PreviewView;
}> = [
  { icon: "pulse", label: "Overview", group: "work", view: "overview" },
  { icon: "inbox", label: "Approvals", group: "work", view: "approvals" },
  { icon: "briefcase", label: "Offers", group: "work", view: "offers" },
  { icon: "globe", label: "Platforms", group: "work", view: "platforms" },
  { icon: "history", label: "History", group: "data" },
  { icon: "graph", label: "Analytics", group: "data" },
  { icon: "file", label: "Resume", group: "setup" },
  { icon: "gear", label: "Settings", group: "setup" },
];

const VIEW_TITLES: Record<PreviewView, string> = {
  overview: "Overview",
  approvals: "Approvals",
  offers: "Offers",
  platforms: "Platforms",
};

const STATS = [
  { label: "Platforms monitored", value: "193", icon: "globe" },
  { label: "Pending approvals", value: "6", icon: "bell", highlight: true },
  { label: "Offers detected", value: "47", icon: "briefcase" },
  { label: "Submitted", value: "12", icon: "check" },
] as const;

const OFFERS = [
  {
    title: "Senior Frontend Engineer",
    company: "Lumio",
    platform: "Indeed",
    platformUrl: "https://www.indeed.com",
    location: "Paris · Hybrid",
    salary: "65k€–85k€",
    time: "2m ago",
    status: "new" as const,
    lang: "EN",
    contract: "FULL-TIME",
  },
  {
    title: "Développeur Full-Stack",
    company: "ParisLab",
    platform: "Welcome to the Jungle",
    platformUrl: "https://www.welcometothejungle.com",
    location: "Lyon · Hybrid",
    salary: "55k€–70k€",
    time: "8m ago",
    status: "importing" as const,
    lang: "FR",
    contract: "FULL-TIME",
    progress: 53,
  },
  {
    title: "Full-Stack Engineer",
    company: "Driftwood",
    platform: "LinkedIn Jobs",
    platformUrl: "https://www.linkedin.com/jobs",
    location: "Remote",
    salary: "$140k–$180k",
    time: "1h ago",
    status: "new" as const,
    lang: "EN",
    contract: "REMOTE",
  },
  {
    title: "React Native Engineer",
    company: "NovaTech",
    platform: "Wellfound",
    platformUrl: "https://wellfound.com",
    location: "Berlin",
    salary: "70k€–90k€",
    time: "1h ago",
    status: "pending" as const,
    lang: "EN",
    contract: "FULL-TIME",
  },
  {
    title: "Product Engineer",
    company: "Atelier",
    platform: "Apec",
    platformUrl: "https://www.apec.fr",
    location: "Paris",
    salary: "58k€–72k€",
    time: "3h ago",
    status: "new" as const,
    lang: "FR",
    contract: "FULL-TIME",
  },
];

const APPROVALS = [
  {
    company: "Lumio",
    title: "Senior Frontend Engineer",
    score: 87,
    lang: "EN" as const,
    platform: "Indeed",
    platformUrl: "https://www.indeed.com",
  },
  {
    company: "ParisLab",
    title: "Développeur Full-Stack",
    score: 95,
    lang: "FR" as const,
    platform: "Welcome to the Jungle",
    platformUrl: "https://www.welcometothejungle.com",
  },
  {
    company: "Driftwood",
    title: "Full-Stack Engineer",
    score: 82,
    lang: "EN" as const,
    platform: "LinkedIn Jobs",
    platformUrl: "https://www.linkedin.com/jobs",
  },
  {
    company: "Atelier",
    title: "Product Engineer",
    score: 91,
    lang: "FR" as const,
    platform: "Apec",
    platformUrl: "https://www.apec.fr",
  },
];

/** Best-known boards shown in the Platforms preview (real URLs → favicons). */
const PLATFORMS = [
  {
    name: "Indeed",
    url: "https://www.indeed.com",
    category: "Generalist",
    login: true,
  },
  {
    name: "LinkedIn Jobs",
    url: "https://www.linkedin.com/jobs",
    category: "Generalist",
    login: true,
  },
  {
    name: "Glassdoor",
    url: "https://www.glassdoor.com",
    category: "Generalist",
    login: true,
  },
  {
    name: "Welcome to the Jungle",
    url: "https://www.welcometothejungle.com",
    category: "France",
    login: true,
  },
  {
    name: "Wellfound",
    url: "https://wellfound.com",
    category: "Startup",
    login: true,
  },
  {
    name: "We Work Remotely",
    url: "https://weworkremotely.com",
    category: "Remote",
    login: false,
  },
  {
    name: "Apec",
    url: "https://www.apec.fr",
    category: "France",
    login: true,
  },
  {
    name: "Monster",
    url: "https://www.monster.com",
    category: "Generalist",
    login: false,
  },
  {
    name: "Otta",
    url: "https://otta.com",
    category: "Startup",
    login: true,
  },
  {
    name: "Dice",
    url: "https://www.dice.com",
    category: "Tech",
    login: true,
  },
  {
    name: "Reed",
    url: "https://www.reed.co.uk",
    category: "Regional",
    login: true,
  },
  {
    name: "Arc.dev",
    url: "https://arc.dev",
    category: "Tech",
    login: true,
  },
] as const;

const CYCLE: PreviewView[] = ["overview", "platforms", "offers", "approvals"];

function StatusPill({
  status,
}: {
  status: "new" | "importing" | "pending";
}) {
  if (status === "importing") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-semibold text-primary sm:text-[9px]">
        <Icon name="sync" size={9} className="animate-spin" />
        Importing
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="rounded bg-[#FF9F1C]/15 px-1.5 py-0.5 text-[8px] font-bold text-[#FF9F1C] sm:text-[9px]">
        PENDING
      </span>
    );
  }
  return (
    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[8px] font-bold uppercase text-primary sm:text-[9px]">
      New
    </span>
  );
}

export function LandingDashboardPreview() {
  const [view, setView] = useState<PreviewView>("overview");

  useEffect(() => {
    const id = setInterval(() => {
      setView((current) => {
        const i = CYCLE.indexOf(current);
        return CYCLE[(i + 1) % CYCLE.length];
      });
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[1230px] rounded-lg bg-background">
      <div
        className="relative w-full overflow-hidden rounded-lg bg-background shadow-2xl ring-1 ring-black/10"
        style={{ aspectRatio: "1230 / 720" }}
        aria-label="Desktop preview with Aply dashboard"
      >
        <img
          src="/desktop-bg.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0 bg-black/10" />

        <div
          className="absolute inset-[3.5%] z-10 flex overflow-hidden rounded-md bg-card select-none sm:inset-[4.5%] md:inset-[5%_5.5%]"
          style={{
            boxShadow:
              "0 28px 70px rgba(0,0,0,0.14), 0 14px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.08)",
          }}
        >
          {/* Cocoa sidebar — mirrors dashboard-shell */}
          <aside className="hidden w-[9.5rem] shrink-0 flex-col border-r border-[#3D2A1C] bg-[#24160E] text-[#F3E6D4] sm:flex md:w-[11rem]">
            <div className="flex h-10 items-center border-b border-[#3D2A1C] px-2.5 md:h-11 md:px-3">
              <div className="min-w-0 leading-tight">
                <p className="font-heading text-sm font-semibold tracking-tight text-[#FFF4DC] md:text-base">
                  Aply
                </p>
                <p className="text-[8px] uppercase tracking-[0.14em] text-[#A8927A] md:text-[9px]">
                  Local agent
                </p>
              </div>
            </div>

            <nav className="aply-scroll flex-1 overflow-y-auto px-1.5 py-2">
              {(
                [
                  { key: "work", label: "Work" },
                  { key: "data", label: "Data" },
                  { key: "setup", label: "Setup" },
                ] as const
              ).map((g) => (
                <div key={g.key} className="mb-2">
                  <p className="mb-0.5 px-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-[#8A7460] md:text-[9px]">
                    {g.label}
                  </p>
                  <ul className="space-y-0.5">
                    {NAV.filter((n) => n.group === g.key).map((item) => {
                      const active = item.view != null && view === item.view;

                      return (
                        <li key={`${g.key}-${item.label}`}>
                          <button
                            type="button"
                            disabled={!item.view}
                            onClick={() => {
                              if (item.view) setView(item.view);
                            }}
                            className={cn(
                              "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[10px] transition-colors md:gap-2 md:px-2 md:py-1.5 md:text-[11px]",
                              active
                                ? "bg-[#C65D00] text-[#FFF4DC]"
                                : "text-[#D4C4B0] hover:bg-[#3A2417] hover:text-[#FFF4DC]",
                              !item.view && "cursor-default opacity-55"
                            )}
                          >
                            <Icon
                              name={item.icon}
                              size={12}
                              className="shrink-0 opacity-90"
                            />
                            <span className="min-w-0 flex-1 truncate">
                              {item.label}
                            </span>
                            {item.label === "Approvals" && (
                              <span
                                className={cn(
                                  "rounded px-1 py-0.5 text-[8px] font-semibold tabular-nums",
                                  active
                                    ? "bg-[#FFF4DC]/20 text-[#FFF4DC]"
                                    : "bg-[#FF9F1C]/20 text-[#FF9F1C]"
                                )}
                              >
                                6
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="border-t border-[#3D2A1C] px-2 py-2">
              <div className="flex items-center gap-1.5 rounded-md bg-[#1F3A24] px-2 py-1.5 text-[9px] text-[#7DCEA0] md:text-[10px]">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2ea043] opacity-50" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2ea043]" />
                </span>
                Monitoring live
              </div>
            </div>
          </aside>

          {/* Main workspace */}
          <div className="flex min-w-0 flex-1 flex-col bg-background">
            <div className="relative flex h-6 shrink-0 items-center justify-between border-b border-border bg-card px-2 sm:h-7">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[#B23A1E]/40 sm:h-2.5 sm:w-2.5" />
                <span className="inline-block h-2 w-2 rounded-full bg-[#FF9F1C]/40 sm:h-2.5 sm:w-2.5" />
                <span className="inline-block h-2 w-2 rounded-full bg-[#2ea043]/40 sm:h-2.5 sm:w-2.5" />
              </div>
              <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 truncate text-center text-[10px] opacity-70 sm:text-xs">
                Aply Dashboard
              </div>
              <Link
                href="/dashboard"
                className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-2 sm:text-xs"
              >
                Open
              </Link>
            </div>

            <header className="flex h-9 shrink-0 items-center gap-2 border-b border-border bg-card/90 px-2.5 sm:h-10 sm:px-3">
              <h2 className="truncate font-heading text-sm font-semibold text-foreground first-letter:text-[1.35em] sm:text-base">
                {VIEW_TITLES[view]}
              </h2>
              <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
                <span className="hidden items-center gap-1 rounded-md bg-[#2ea043]/12 px-1.5 py-0.5 text-[9px] font-medium text-[#1f7a32] sm:inline-flex sm:text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2ea043]" />
                  Live
                </span>
                {CYCLE.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setView(s)}
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[8px] font-medium capitalize transition-colors sm:px-2 sm:text-[10px]",
                      view === s
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s === "overview" ? "Overview" : s}
                  </button>
                ))}
              </div>
            </header>

            <div className="aply-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3">
              <AnimatePresence mode="wait">
                {view === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                  >
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
                      {STATS.map((stat, i) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, scale: 0.94 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className={cn(
                            "rounded-lg border border-border bg-card px-2 py-1.5 sm:px-2.5 sm:py-2",
                            "highlight" in stat &&
                              stat.highlight &&
                              "border-primary/35 bg-primary/5"
                          )}
                        >
                          <div className="flex items-center gap-1 text-[7px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[9px]">
                            <Icon name={stat.icon} size={10} />
                            <span className="truncate">{stat.label}</span>
                          </div>
                          <p className="mt-0.5 font-heading text-base font-semibold tabular-nums text-foreground sm:text-xl">
                            {stat.value}
                          </p>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-2 overflow-hidden rounded-lg border border-border bg-card sm:mt-3">
                      <div className="flex items-center justify-between border-b border-border px-2.5 py-1.5 sm:px-3 sm:py-2">
                        <div className="flex items-center gap-1.5">
                          <Icon name="pulse" size={12} className="text-primary" />
                          <p className="text-[10px] font-semibold text-foreground sm:text-xs">
                            Recently detected offers
                          </p>
                        </div>
                        <span className="text-[8px] text-primary sm:text-[10px]">
                          View all
                        </span>
                      </div>
                      <ul className="divide-y divide-border">
                        {OFFERS.slice(0, 4).map((offer, i) => (
                          <motion.li
                            key={offer.title}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.04 }}
                            className="flex items-center gap-2 px-2.5 py-1.5 sm:gap-2.5 sm:px-3 sm:py-2"
                          >
                            <PlatformLogo
                              url={offer.platformUrl}
                              name={offer.platform}
                              size={28}
                              className="rounded-md border border-border bg-card"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="truncate text-[10px] font-medium text-foreground sm:text-xs">
                                  {offer.title}
                                </p>
                                <StatusPill status={offer.status} />
                              </div>
                              <p className="truncate text-[8px] text-muted-foreground sm:text-[10px]">
                                <span className="font-medium text-foreground/80">
                                  {offer.platform}
                                </span>
                                {" · "}
                                {offer.company}
                                {" · "}
                                {offer.time}
                              </p>
                            </div>
                            <span className="hidden shrink-0 rounded-md bg-primary px-2 py-0.5 text-[8px] font-medium text-primary-foreground sm:inline md:text-[9px]">
                              Prepare
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}

                {view === "platforms" && (
                  <motion.div
                    key="platforms"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                  >
                    <div className="mb-2 flex items-end justify-between gap-2">
                      <div>
                        <p className="font-heading text-sm font-semibold text-foreground sm:text-base">
                          Monitored platforms
                        </p>
                        <p className="text-[9px] text-muted-foreground sm:text-[10px]">
                          193 platforms · 24/7 scanning
                        </p>
                      </div>
                      <span className="rounded-md bg-primary px-2 py-1 text-[8px] font-medium text-primary-foreground sm:text-[10px]">
                        + Add platform
                      </span>
                    </div>
                    <div className="mb-2 flex gap-1.5">
                      <div className="flex h-7 flex-1 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-[9px] text-muted-foreground sm:h-8 sm:text-[10px]">
                        <Icon name="search" size={11} />
                        Search platforms by name...
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-border bg-card">
                      <ul className="divide-y divide-border">
                        {PLATFORMS.map((p, i) => (
                          <motion.li
                            key={p.name}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-2 px-2.5 py-1.5 sm:gap-2.5 sm:px-3 sm:py-2"
                          >
                            <PlatformLogo
                              url={p.url}
                              name={p.name}
                              size={26}
                              className="rounded-md border border-border bg-card"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                <span className="truncate text-[10px] font-medium text-foreground sm:text-xs">
                                  {p.name}
                                </span>
                                <span className="rounded border border-border bg-muted px-1 py-0.5 text-[7px] font-medium text-muted-foreground sm:text-[8px]">
                                  {p.category}
                                </span>
                                {p.login && (
                                  <span className="hidden items-center gap-0.5 rounded border border-border bg-muted px-1 py-0.5 text-[7px] text-muted-foreground sm:inline-flex sm:text-[8px]">
                                    <Icon name="shield-lock" size={8} />
                                    Login
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-[8px] text-muted-foreground sm:text-[9px]">
                                {p.url.replace(/^https?:\/\//, "")}
                              </p>
                            </div>
                            <span className="hidden rounded-md border border-border px-1.5 py-0.5 text-[8px] text-muted-foreground sm:inline md:text-[9px]">
                              Open
                            </span>
                            <span className="inline-flex h-5 items-center gap-1 rounded-md border border-border bg-background px-1.5 text-[8px] font-medium text-foreground sm:h-6 sm:text-[9px]">
                              Monitoring
                              <span className="relative h-3 w-5 rounded-full bg-primary sm:h-3.5 sm:w-6">
                                <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-primary-foreground sm:h-2.5 sm:w-2.5" />
                              </span>
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}

                {view === "offers" && (
                  <motion.div
                    key="offers"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                  >
                    <div className="mb-2">
                      <p className="font-heading text-sm font-semibold text-foreground sm:text-base">
                        Job offers
                      </p>
                      <p className="text-[9px] text-muted-foreground sm:text-[10px]">
                        Browse detected offers and prepare applications
                      </p>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <div className="flex h-7 min-w-[10rem] flex-1 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-[9px] text-muted-foreground sm:h-8 sm:text-[10px]">
                        <Icon name="search" size={11} />
                        Search title, company, platform...
                      </div>
                      <span className="inline-flex h-7 items-center rounded-md border border-border bg-card px-2 text-[8px] text-muted-foreground sm:h-8 sm:text-[9px]">
                        All statuses
                      </span>
                      <span className="inline-flex h-7 items-center rounded-md border border-border bg-card px-2 text-[8px] text-muted-foreground sm:h-8 sm:text-[9px]">
                        All sources
                      </span>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-border bg-card">
                      <ul className="divide-y divide-border">
                        {OFFERS.map((offer, i) => (
                          <motion.li
                            key={offer.title}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-2 px-2.5 py-2 sm:gap-2.5 sm:px-3"
                          >
                            <PlatformLogo
                              url={offer.platformUrl}
                              name={offer.platform}
                              size={30}
                              className="rounded-lg border border-border bg-card"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="truncate text-[10px] font-medium text-foreground sm:text-xs">
                                  {offer.title}
                                </p>
                                <span className="rounded border border-border bg-muted px-1 py-0.5 text-[7px] text-muted-foreground">
                                  {offer.lang}
                                </span>
                                <span className="rounded border border-border bg-muted px-1 py-0.5 text-[7px] text-muted-foreground">
                                  {offer.contract}
                                </span>
                                <StatusPill status={offer.status} />
                              </div>
                              <p className="mt-0.5 truncate text-[8px] text-muted-foreground sm:text-[10px]">
                                <span className="font-medium text-foreground/80">
                                  {offer.platform}
                                </span>
                                {" · "}
                                {offer.company}
                                {" · "}
                                {offer.location}
                                {" · "}
                                {offer.salary}
                                {" · "}
                                {offer.time}
                              </p>
                              {offer.status === "importing" && (
                                <div className="mt-1 flex items-center gap-1.5">
                                  <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                                    <div
                                      className="h-full rounded-full bg-primary"
                                      style={{ width: `${offer.progress ?? 40}%` }}
                                    />
                                  </div>
                                  <span className="text-[8px] text-muted-foreground">
                                    {offer.progress}%
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="shrink-0 rounded-md bg-primary px-2 py-1 text-[8px] font-medium text-primary-foreground sm:text-[9px]">
                              Prepare
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}

                {view === "approvals" && (
                  <motion.div
                    key="approvals"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[10px]">
                        Waiting for your approval
                      </p>
                      <p className="text-[9px] text-muted-foreground sm:text-[10px]">
                        {APPROVALS.length} drafts
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
                      {APPROVALS.map((app, i) => (
                        <motion.div
                          key={`${app.company}-${app.title}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="rounded-lg border border-border bg-card p-2 sm:p-2.5"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                              <PlatformLogo
                                url={app.platformUrl}
                                name={app.platform}
                                size={26}
                                className="rounded-md border border-border bg-card"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-[10px] font-medium text-foreground sm:text-xs">
                                  {app.title}
                                </p>
                                <p className="truncate text-[8px] text-muted-foreground sm:text-[10px]">
                                  {app.company} · {app.platform}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <svg
                                viewBox="0 0 36 36"
                                className="h-5 w-5 -rotate-90 sm:h-6 sm:w-6"
                              >
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="15"
                                  fill="none"
                                  stroke="var(--border)"
                                  strokeWidth="4"
                                />
                                <motion.circle
                                  initial={{ strokeDasharray: "0 94.2" }}
                                  animate={{
                                    strokeDasharray: `${(app.score / 100) * 94.2} 94.2`,
                                  }}
                                  transition={{ delay: 0.15, duration: 0.45 }}
                                  cx="18"
                                  cy="18"
                                  r="15"
                                  fill="none"
                                  stroke={
                                    app.score >= 80 ? "#2ea043" : "#FF9F1C"
                                  }
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className="text-[10px] font-bold text-foreground sm:text-xs">
                                {app.score}%
                              </span>
                            </div>
                          </div>
                          <div className="mt-1.5 rounded-md bg-background/70 p-1.5 sm:mt-2 sm:p-2">
                            <p className="line-clamp-2 text-[9px] leading-relaxed text-muted-foreground sm:text-[10px]">
                              {app.lang === "FR"
                                ? `Bonjour l'équipe ${app.company}, votre offre résonne particulièrement avec ce que je cherche...`
                                : `Hi ${app.company} team, your post stood out. I've spent the last few years shipping...`}
                            </p>
                          </div>
                          <div className="mt-1.5 flex gap-1 sm:mt-2 sm:gap-1.5">
                            <span className="flex-1 rounded-md bg-primary py-0.5 text-center text-[8px] font-medium text-primary-foreground sm:py-1 sm:text-[10px]">
                              Approve & submit
                            </span>
                            <span className="rounded-md bg-muted px-1.5 py-0.5 text-center text-[8px] text-muted-foreground sm:px-2 sm:py-1 sm:text-[10px]">
                              Reject
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
