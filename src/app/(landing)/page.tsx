"use client";
/**
 * Landing page for Aply.
 *
 * Hero with:
 * - Floating rounded nav (transparent on scroll)
 * - Real dashboard preview (interactive, not a simplified mock)
 * - Background image behind the browser window
 * - "View live demo" button
 */
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/aply/icon";
import { ScrollStrokePath } from "@/components/aply/scroll-stroke-path";

const FEATURES = [
  { icon: "pulse", title: "24/7 monitoring", desc: "190+ job boards watched around the clock. New offers detected and imported automatically." },
  { icon: "pencil", title: "Authentic drafts", desc: "Cover letters in your voice, grounded in your resume. No AI-tell phrases. Quality checked." },
  { icon: "comment-discussion", title: "Approve before submit", desc: "Never submits without your green light. WhatsApp or email. One tap to approve." },
  { icon: "globe", title: "Career page first", desc: "Checks the company career page before applying via a job board. No middleman when avoidable." },
  { icon: "diff", title: "Form variation handling", desc: "Each platform asks different questions. Aply detects, answers, and fills everything." },
  { icon: "shield-lock", title: "Local-first", desc: "Your data stays on your machine. No cloud, no tracking. Your browser sessions." },
];

const STEPS = [
  { num: "01", title: "Sign up", desc: "Create your account. Onboard with resume, emails, preferences." },
  { num: "02", title: "Install extension", desc: "Add Aply to Chrome. Right-click any job page to capture it." },
  { num: "03", title: "Approve drafts", desc: "Aply scans, detects, drafts. You approve. Done." },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  useEffect(() => {
    const unsub = scrollY.on("change", (y) => setScrolled(y > 20));
    return () => unsub();
  }, [scrollY]);

  const heroY = useTransform(scrollY, [0, 400], [0, -60]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.4]);
  const previewScale = useTransform(scrollY, [0, 600], [1, 0.92]);

  return (
    <div className="min-h-screen bg-background">
      {/* Floating nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="fixed left-1/2 top-3 z-50 -translate-x-1/2 px-4"
        style={{ width: "min(100% - 1.5rem, 900px)" }}
      >
        <div
          className={`flex items-center justify-between rounded-full px-4 py-2 transition-all duration-300 sm:px-6 ${
            scrolled
              ? "bg-card/70 shadow-lg ring-1 ring-border/20 backdrop-blur-xl"
              : "bg-card/20 backdrop-blur-sm"
          }`}
        >
          <Link href="/" className="flex items-center gap-2">
            <Icon name="rocket" size={18} className="text-primary sm:h-5 sm:w-5" />
            <span className="font-heading text-sm font-semibold sm:text-base">Aply</span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <a href="#features" className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
            <a href="#how" className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">How it works</a>
            <a href="#extension" className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">Extension</a>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/dashboard" className="rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3 sm:text-sm">
              Demo
            </Link>
            <Link href="/signup" className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-accent sm:px-4 sm:text-sm">
              Get started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero copy */}
      <section className="relative overflow-x-hidden px-4 pt-24 pb-6 sm:px-6 sm:pt-32 sm:pb-8 md:pt-36">
        {/* Background image behind hero */}
        <div className="pointer-events-none absolute inset-0 -z-20">
          <img
            src="/landing-bg.jpg"
            alt=""
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="mx-auto max-w-4xl text-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex max-w-[min(100%,22rem)] items-center gap-1.5 rounded-full bg-muted/80 px-2.5 py-1 text-[10px] font-medium leading-tight text-muted-foreground backdrop-blur-sm sm:max-w-none sm:px-3 sm:text-xs"
          >
            <Icon name="zap" size={11} className="shrink-0 text-primary" />
            Local-first · 24/7 monitoring · Authentic drafts
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-4 font-heading text-[1.75rem] font-semibold leading-[1.12] text-foreground sm:mt-6 sm:text-4xl sm:leading-[1.08] md:text-5xl lg:text-6xl lg:leading-[1.05]"
          >
            Apply to every job that fits.{" "}
            <span className="aply-gradient-text">Aply writes, you approve.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base md:text-lg"
          >
            Aply watches 190+ job boards around the clock, drafts authentic cover letters in your voice, and asks for your green light before every single submission.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:mt-8 sm:flex-row sm:gap-3"
          >
            <Link href="/signup" className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-accent hover:shadow-primary/30 sm:h-11 sm:px-6">
              <Icon name="rocket" size={16} />
              Start free
            </Link>
            <Link href="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card/50 px-5 text-sm font-medium text-foreground backdrop-blur-sm transition-all hover:bg-card sm:h-11 sm:px-6">
              <Icon name="eye" size={16} />
              View live demo
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Spotlight: stroke leaves from behind preview, exits behind footer */}
      <div ref={spotlightRef} className="relative overflow-x-hidden">
        <ScrollStrokePath containerRef={spotlightRef} />

        <motion.div
          style={{ scale: previewScale }}
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 mx-auto mt-4 w-full max-w-[1230px] px-4 sm:mt-6 sm:px-6 [isolation:isolate]"
        >
          <DashboardPreview />
        </motion.div>

        {/* Features */}
        <section id="features" className="relative z-10 px-4 py-14 sm:px-6 sm:py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10 text-center sm:mb-14">
              <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">Everything you need to apply faster</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:mt-4 sm:text-base md:text-lg">No more manual form filling. No more generic cover letters. No more missed opportunities.</p>
            </motion.div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="group flex flex-col gap-2.5 sm:gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:scale-110 group-hover:bg-primary/15 sm:h-11 sm:w-11">
                    <Icon name={f.icon} size={18} />
                  </span>
                  <h3 className="font-heading text-base font-semibold text-foreground sm:text-lg">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="relative z-10 border-y border-border bg-card/30 px-4 py-14 sm:px-6 sm:py-20 md:py-28">
          <div className="mx-auto max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10 text-center sm:mb-14">
              <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">Three steps to never miss a job</h2>
            </motion.div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10">
              {STEPS.map((step, i) => (
                <motion.div key={step.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative flex flex-col gap-2 sm:gap-3">
                  <span className="font-heading text-3xl font-bold text-primary/20 sm:text-4xl md:text-5xl">{step.num}</span>
                  <h3 className="font-heading text-lg font-semibold text-foreground sm:text-xl">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                  {i < STEPS.length - 1 && <Icon name="arrow-right" size={20} className="absolute -right-6 top-8 hidden text-border md:block" />}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <div className="relative z-10">
          <ExtensionSection />
        </div>

        {/* CTA */}
        <section className="relative z-10 px-4 py-16 sm:px-6 sm:py-24 md:py-32">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">Ready to let Aply handle the grind?</h2>
            <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base md:text-lg">Set up your profile in 2 minutes. Aply starts scanning immediately.</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
              <Link href="/signup" className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-accent hover:shadow-primary/30 sm:h-11 sm:px-6">
                <Icon name="rocket" size={16} /> Create your account
              </Link>
              <Link href="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:h-11 sm:px-6">
                <Icon name="eye" size={16} /> Explore the demo
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Underlap zone — path keeps going so the footer can cover it */}
        <div className="pointer-events-none h-24 sm:h-32" aria-hidden />
      </div>

      {/* Footer (unchanged) — sits over the stroke to hide the end */}
      <footer className="relative z-20 -mt-24 border-t border-border bg-background px-4 py-12 sm:-mt-32 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Icon name="rocket" size={18} className="text-primary" />
              <span className="font-heading font-semibold">Aply</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/login" className="hover:text-foreground">Log in</Link>
              <Link href="/signup" className="hover:text-foreground">Sign up</Link>
              <Link href="/dashboard" className="hover:text-foreground">Demo</Link>
              <Link href="/api-explorer" className="hover:text-foreground">API</Link>
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 sm:flex-row">
            <p className="text-xs text-muted-foreground">Local-first · No data leaves your machine</p>
            <p className="text-xs text-muted-foreground">Built with Next.js 16 · Prisma · TypeScript</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const PREVIEW_STATS = [
  { label: "Platforms", value: "193", icon: "globe", color: "text-primary" },
  { label: "Pending", value: "6", icon: "bell", color: "text-[#FF9F1C]" },
  { label: "Offers", value: "47", icon: "pulse", color: "text-[#2ea043]" },
  { label: "Submitted", value: "12", icon: "check", color: "text-muted-foreground" },
] as const;

const PREVIEW_OFFERS = [
  { company: "Lumio", title: "Senior Frontend Engineer", time: "2m ago", status: "pending" as const },
  { company: "ParisLab", title: "Développeur Full-Stack", time: "8m ago", status: "pending" as const },
  { company: "Driftwood", title: "Full-Stack Engineer", time: "1h ago", status: "new" as const },
  { company: "NovaTech", title: "React Native Engineer", time: "1h ago", status: "new" as const },
  { company: "Atelier", title: "Product Engineer", time: "3h ago", status: "pending" as const },
  { company: "Horizon", title: "Software Engineer II", time: "4h ago", status: "new" as const },
  { company: "Cinder", title: "Frontend Lead", time: "5h ago", status: "pending" as const },
  { company: "Bloom", title: "Full-Stack Developer", time: "6h ago", status: "new" as const },
];

const PREVIEW_APPROVALS = [
  { company: "Lumio", title: "Senior Frontend Engineer", score: 87, lang: "EN" as const, platform: "Indeed" },
  { company: "ParisLab", title: "Développeur Full-Stack", score: 95, lang: "FR" as const, platform: "WTTJ" },
  { company: "Driftwood", title: "Full-Stack Engineer", score: 82, lang: "EN" as const, platform: "LinkedIn" },
  { company: "Atelier", title: "Product Engineer", score: 91, lang: "FR" as const, platform: "Career page" },
  { company: "NovaTech", title: "React Native Engineer", score: 78, lang: "EN" as const, platform: "Greenhouse" },
  { company: "Horizon", title: "Software Engineer II", score: 88, lang: "EN" as const, platform: "Lever" },
];

const PREVIEW_ACTIVITY = [
  { label: "Draft ready · Lumio", time: "Just now" },
  { label: "Offer imported · NovaTech", time: "12m ago" },
  { label: "Submitted · Bloom", time: "1h ago" },
  { label: "Match found · Horizon", time: "2h ago" },
];

/**
 * Real dashboard preview — Cursor-style stage:
 * desktop wallpaper 1230×720 behind an agent browser window 1080×620.
 */
function DashboardPreview() {
  const [activeSection, setActiveSection] = useState<"monitoring" | "approvals" | "analytics">("approvals");

  useEffect(() => {
    const id = setInterval(() => {
      setActiveSection((s) => {
        if (s === "monitoring") return "approvals";
        if (s === "approvals") return "analytics";
        return "monitoring";
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[1230px] rounded-lg bg-background">
      {/* Desktop stage · 1230×720 */}
      <div
        className="relative w-full overflow-hidden rounded-lg bg-background shadow-2xl ring-1 ring-black/10"
        style={{ aspectRatio: "1230 / 720" }}
        aria-label="Desktop preview with Aply agent window"
      >
        <img
          src="/desktop-bg.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0 bg-black/10" />

        {/* Agent browser · fills stage so content can scroll inside */}
        <div
          className="absolute inset-[4%] z-10 flex flex-col overflow-hidden rounded-md bg-card select-none sm:inset-[5%] md:inset-[5.5%_6%]"
          style={{
            boxShadow:
              "0 28px 70px rgba(0,0,0,0.14), 0 14px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.08)",
          }}
        >
          {/* Browser chrome */}
          <div className="relative flex h-6 shrink-0 items-center justify-between border-b border-border px-2 sm:h-7">
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

          {/* Dashboard header bar */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-2 py-1.5 sm:px-4 sm:py-2">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <Icon name="rocket" size={14} className="shrink-0 text-primary" />
              <span className="text-xs font-semibold sm:text-sm">Aply</span>
              <span className="hidden text-[10px] text-muted-foreground md:inline sm:text-xs">Auto-application agent</span>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1.5">
              <span className="flex items-center gap-1 rounded-full bg-[#2ea043]/10 px-1.5 py-0.5 text-[8px] font-medium text-[#2ea043] sm:px-2 sm:text-[10px]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2ea043] opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2ea043]" />
                </span>
                Live
              </span>
              {(["monitoring", "approvals", "analytics"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setActiveSection(s)}
                  className={`rounded-md px-1.5 py-0.5 text-[8px] font-medium capitalize transition-colors sm:px-2 sm:py-1 sm:text-[10px] ${
                    activeSection === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Dashboard content — scrollable when examples overflow */}
          <div className="aply-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-background p-2 sm:p-3 md:p-4">
            <AnimatePresence mode="wait">
              {activeSection === "monitoring" && (
                <motion.div key="monitoring" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {PREVIEW_STATS.map((stat, i) => (
                      <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} className="rounded-lg bg-card p-1.5 ring-1 ring-border/30 sm:rounded-xl sm:p-2.5">
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <Icon name={stat.icon} size={9} className={`hidden sm:inline ${stat.color}`} />
                          <span className="truncate text-[7px] uppercase tracking-wide text-muted-foreground sm:text-[9px]">{stat.label}</span>
                        </div>
                        <p className={`mt-0.5 font-heading text-sm font-bold sm:text-lg md:text-xl ${stat.color}`}>{stat.value}</p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:mt-3 lg:grid-cols-[1.4fr_1fr]">
                    <div className="rounded-lg bg-card p-2 ring-1 ring-border/30 sm:rounded-xl sm:p-3">
                      <p className="mb-1.5 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground sm:mb-2 sm:text-[10px]">Recently detected</p>
                      <div className="space-y-1 sm:space-y-1.5">
                        {PREVIEW_OFFERS.map((offer, i) => (
                          <motion.div key={`${offer.company}-${offer.title}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }} className="flex items-center gap-1.5 rounded-md bg-background/50 px-1.5 py-1 sm:gap-2 sm:rounded-lg sm:px-2 sm:py-1.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[7px] font-bold text-primary sm:h-7 sm:w-7 sm:rounded-lg sm:text-[9px]">{offer.company.slice(0, 2).toUpperCase()}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[10px] font-medium text-foreground sm:text-xs">{offer.title}</p>
                              <p className="truncate text-[8px] text-muted-foreground sm:text-[10px]">{offer.company} · {offer.time}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-1 py-0.5 text-[7px] font-bold sm:px-1.5 sm:text-[8px] ${offer.status === "pending" ? "bg-[#FF9F1C]/15 text-[#FF9F1C]" : "bg-[#2ea043]/10 text-[#2ea043]"}`}>
                              {offer.status === "pending" ? "PENDING" : "NEW"}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg bg-card p-2 ring-1 ring-border/30 sm:rounded-xl sm:p-3">
                      <p className="mb-1.5 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground sm:mb-2 sm:text-[10px]">Agent activity</p>
                      <div className="space-y-1.5 sm:space-y-2">
                        {PREVIEW_ACTIVITY.map((item, i) => (
                          <motion.div key={item.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }} className="rounded-md bg-background/50 px-2 py-1.5 sm:py-2">
                            <p className="text-[10px] font-medium text-foreground sm:text-xs">{item.label}</p>
                            <p className="text-[8px] text-muted-foreground sm:text-[10px]">{item.time}</p>
                          </motion.div>
                        ))}
                      </div>
                      <div className="mt-2 hidden rounded-md bg-primary/5 p-2 ring-1 ring-primary/10 sm:mt-3 sm:block">
                        <p className="text-[9px] font-medium text-primary sm:text-[10px]">Scanning 193 boards</p>
                        <p className="mt-0.5 text-[8px] text-muted-foreground sm:text-[9px]">Next pass in ~4 min · 6 drafts waiting</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === "approvals" && (
                <motion.div key="approvals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                  <div className="mb-1.5 flex items-center justify-between sm:mb-2">
                    <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[10px]">Waiting for your approval</p>
                    <p className="text-[8px] text-muted-foreground sm:text-[10px]">{PREVIEW_APPROVALS.length} drafts</p>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
                    {PREVIEW_APPROVALS.map((app, i) => (
                      <motion.div key={`${app.company}-${app.title}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-lg bg-card p-2 ring-1 ring-border/30 sm:rounded-xl sm:p-3">
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[7px] font-bold text-primary sm:h-7 sm:w-7 sm:rounded-lg sm:text-[9px]">{app.company.slice(0, 2).toUpperCase()}</span>
                            <div className="min-w-0">
                              <p className="truncate text-[10px] font-medium text-foreground sm:text-xs">{app.title}</p>
                              <p className="truncate text-[8px] text-muted-foreground sm:text-[10px]">{app.company} · {app.platform}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <svg viewBox="0 0 36 36" className="h-5 w-5 -rotate-90 sm:h-6 sm:w-6">
                              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="4" />
                              <motion.circle initial={{ strokeDasharray: "0 94.2" }} animate={{ strokeDasharray: `${(app.score / 100) * 94.2} 94.2` }} transition={{ delay: 0.2, duration: 0.5 }} cx="18" cy="18" r="15" fill="none" stroke={app.score >= 80 ? "#2ea043" : "#FF9F1C"} strokeWidth="4" strokeLinecap="round" />
                            </svg>
                            <span className="text-[10px] font-bold text-foreground sm:text-xs">{app.score}%</span>
                          </div>
                        </div>
                        <div className="mt-1.5 rounded-md bg-background/60 p-1.5 sm:mt-2 sm:p-2">
                          <p className="line-clamp-2 text-[9px] leading-relaxed text-muted-foreground sm:text-[10px]">
                            {app.lang === "FR"
                              ? `Bonjour l'équipe ${app.company}, votre offre résonne particulièrement avec ce que je cherche...`
                              : `Hi ${app.company} team, your post stood out. I've spent the last few years shipping...`}
                          </p>
                        </div>
                        <div className="mt-1.5 flex gap-1 sm:mt-2 sm:gap-1.5">
                          <span className="flex-1 rounded-md bg-primary py-0.5 text-center text-[8px] font-medium text-primary-foreground sm:py-1 sm:text-[10px]">Approve & submit</span>
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-center text-[8px] text-muted-foreground sm:px-2 sm:py-1 sm:text-[10px]">Reject</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeSection === "analytics" && (
                <motion.div key="analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {[
                      { label: "Total", value: "47", color: "text-primary" },
                      { label: "Response rate", value: "67%", color: "text-[#2ea043]" },
                      { label: "Avg quality", value: "85%", color: "text-[#FF9F1C]" },
                    ].map((kpi, i) => (
                      <motion.div key={kpi.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} className="rounded-lg bg-card p-1.5 text-center ring-1 ring-border/30 sm:rounded-xl sm:p-2.5">
                        <p className={`font-heading text-sm font-bold sm:text-lg md:text-xl ${kpi.color}`}>{kpi.value}</p>
                        <p className="text-[7px] uppercase tracking-wide text-muted-foreground sm:text-[9px]">{kpi.label}</p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-2 rounded-lg bg-card p-2 ring-1 ring-border/30 sm:mt-3 sm:rounded-xl sm:p-3">
                    <p className="mb-1.5 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground sm:mb-2 sm:text-[10px]">Weekly applications</p>
                    <div className="flex h-16 items-end gap-1 sm:h-28 sm:gap-1.5">
                      {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                        <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.15 + i * 0.04, duration: 0.35 }} className="flex-1 rounded-t-sm bg-primary/60" />
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:mt-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-card p-2 ring-1 ring-border/30 sm:rounded-xl sm:p-3">
                      <p className="mb-1.5 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground sm:mb-2 sm:text-[10px]">Status distribution</p>
                      <div className="flex h-2 overflow-hidden rounded-full sm:h-3">
                        <motion.div initial={{ width: 0 }} animate={{ width: "38%" }} transition={{ delay: 0.3 }} className="bg-[#2ea043]" />
                        <motion.div initial={{ width: 0 }} animate={{ width: "37%" }} transition={{ delay: 0.4 }} className="bg-[#FF9F1C]" />
                        <motion.div initial={{ width: 0 }} animate={{ width: "25%" }} transition={{ delay: 0.5 }} className="bg-[#B23A1E]" />
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[7px] text-muted-foreground sm:mt-2 sm:text-[9px]">
                        <span>Submitted 38%</span>
                        <span>Pending 37%</span>
                        <span>Rejected 25%</span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-card p-2 ring-1 ring-border/30 sm:rounded-xl sm:p-3">
                      <p className="mb-1.5 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground sm:mb-2 sm:text-[10px]">Top platforms</p>
                      <div className="space-y-1.5">
                        {[
                          { name: "Indeed", pct: 34 },
                          { name: "WTTJ", pct: 28 },
                          { name: "LinkedIn", pct: 22 },
                          { name: "Career pages", pct: 16 },
                        ].map((row, i) => (
                          <div key={row.name}>
                            <div className="mb-0.5 flex justify-between text-[8px] sm:text-[9px]">
                              <span className="text-foreground">{row.name}</span>
                              <span className="text-muted-foreground">{row.pct}%</span>
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-muted sm:h-1.5">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${row.pct}%` }} transition={{ delay: 0.25 + i * 0.06 }} className="h-full rounded-full bg-primary/70" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Extension section with right-click illustration.
 */
function ExtensionSection() {
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setShowMenu((s) => !s), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="extension" className="px-4 py-20 sm:px-6 sm:py-32">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Icon name="rocket" size={11} /> Chrome extension
          </span>
          <h2 className="mt-4 font-heading text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">Right-click. Capture. Apply.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">Install the Aply extension. Browse any job board. Right-click on a job offer and Aply captures it instantly. Right-click on an application form and Aply fills every field.</p>
          <ul className="mt-6 space-y-2">
            {["Smart field detection (Greenhouse, Lever, Workday, Ashby)", "Fills name, email, phone, cover letter, custom questions", "Uses your browser sessions, no password sharing", "Download as .zip, load as unpacked extension"].map((item, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-center gap-2 text-sm text-foreground">
                <Icon name="check" size={14} className="shrink-0 text-[#2ea043]" />{item}
              </motion.li>
            ))}
          </ul>
          <Link href="/api/extension/download" download="aply-extension.zip" className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-accent">
            <Icon name="download" size={16} /> Download extension
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="relative">
          <div className="overflow-hidden rounded-lg bg-card shadow-xl ring-1 ring-border/30">
            <div className="border-b border-border bg-background/50 px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1"><span className="h-2 w-2 rounded-full bg-[#B23A1E]/30" /><span className="h-2 w-2 rounded-full bg-[#FF9F1C]/30" /><span className="h-2 w-2 rounded-full bg-[#2ea043]/30" /></div>
                <span className="ml-2 text-xs text-muted-foreground">indeed.com/jobs</span>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <div className="h-3 w-2/3 rounded bg-muted" /><div className="h-2 w-1/2 rounded bg-muted/60" /><div className="h-2 w-3/4 rounded bg-muted/40" /><div className="h-2 w-2/3 rounded bg-muted/40" />
                <div className="mt-3 h-6 w-24 rounded-md bg-primary/20" />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.8, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: -5 }} transition={{ duration: 0.2 }} className="absolute right-8 top-20 z-10 w-56 overflow-hidden rounded-md bg-card shadow-2xl ring-1 ring-border/40">
                <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Aply</div>
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary"><Icon name="rocket" size={14} />Capture this job offer</div>
                <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground"><Icon name="pencil" size={14} />Auto-fill this form</div>
                <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">Aply · Right-click anywhere</div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div animate={{ x: [0, 40, 40, 0], y: [0, 30, 30, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} className="absolute left-12 top-8 z-20">
            <svg width="16" height="20" viewBox="0 0 16 20" fill="none"><path d="M1 1L5 17L7.5 10.5L14 8L1 1Z" fill="#4A2F1A" stroke="#FFE4B5" strokeWidth="1" /></svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
