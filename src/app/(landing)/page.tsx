"use client";
/**
 * Landing page for Aply.
 *
 * Features:
 * - Animated nav with burger toggle + staggered text reveal (GSAP)
 * - Interactive dot-grid background (mouse-reactive, click shockwave)
 * - Scroll-following SVG path that snakes through sections
 * - Real interactive dashboard preview in hero
 * - Background image behind the browser window
 * - "View live demo" button
 */
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/aply/icon";
import { DotGrid } from "@/components/aply/dot-grid";
import { AnimatedNav } from "@/components/aply/animated-nav";
import { ScrollPath } from "@/components/aply/scroll-path";

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
      {/* Animated nav with burger + staggered text reveal */}
      <AnimatedNav />

      {/* Scroll-following SVG path (desktop only, behind content) */}
      <ScrollPath />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-24 pb-8 sm:px-6 sm:pt-28">
        {/* Interactive dot-grid background (only behind hero) */}
        <DotGrid
          dotSize={4}
          gap={20}
          baseColor="#E5D5B5"
          activeColor="#C65D00"
          proximity={120}
          speedTrigger={80}
          shockRadius={200}
          shockStrength={4}
          className="opacity-40"
        />

        {/* Background image behind hero */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <img
            src="/landing-bg.jpg"
            alt=""
            className="h-full w-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="mx-auto max-w-4xl text-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm"
          >
            <Icon name="zap" size={11} className="text-primary" />
            Local-first · 24/7 monitoring · Authentic drafts
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6 font-heading text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Apply to every job that fits.{" "}
            <span className="aply-gradient-text">Aply writes, you approve.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Aply watches 190+ job boards around the clock, drafts authentic cover letters in your voice, and asks for your green light before every single submission.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link href="/signup" className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-accent hover:shadow-primary/30">
              <Icon name="rocket" size={16} />
              Start free
            </Link>
            <Link href="/dashboard" className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card/50 px-6 text-sm font-medium text-foreground backdrop-blur-sm transition-all hover:bg-card">
              <Icon name="eye" size={16} />
              View live demo
            </Link>
          </motion.div>
        </motion.div>

        {/* Real dashboard preview */}
        <motion.div
          style={{ scale: previewScale }}
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-12 max-w-5xl sm:mt-16"
        >
          <DashboardPreview />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-20 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14 text-center">
            <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">Everything you need to apply faster</h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">No more manual form filling. No more generic cover letters. No more missed opportunities.</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="group flex flex-col gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:scale-110 group-hover:bg-primary/15">
                  <Icon name={f.icon} size={20} />
                </span>
                <h3 className="font-heading text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative overflow-hidden border-y border-border bg-card/30 px-4 py-20 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14 text-center">
            <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">Three steps to never miss a job</h2>
          </motion.div>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative flex flex-col gap-3">
                <span className="font-heading text-5xl font-bold text-primary/20">{step.num}</span>
                <h3 className="font-heading text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
                {i < STEPS.length - 1 && <Icon name="arrow-right" size={20} className="absolute -right-6 top-8 hidden text-border sm:block" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <ExtensionSection />

      {/* CTA */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-36">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <img src="/landing-bg.jpg" alt="" className="h-full w-full object-cover opacity-10" />
        </div>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">Ready to let Aply handle the grind?</h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">Set up your profile in 2 minutes. Aply starts scanning immediately.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-accent hover:shadow-primary/30">
              <Icon name="rocket" size={16} /> Create your account
            </Link>
            <Link href="/dashboard" className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              <Icon name="eye" size={16} /> Explore the demo
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-12 sm:px-6">
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

/**
 * Real dashboard preview - looks like the actual Aply dashboard.
 * Interactive: tabs switch between sections, stats animate, approval cards.
 */
function DashboardPreview() {
  const [activeSection, setActiveSection] = useState<"monitoring" | "approvals" | "analytics">("monitoring");

  useEffect(() => {
    const id = setInterval(() => {
      setActiveSection((s) => {
        if (s === "monitoring") return "approvals";
        if (s === "approvals") return "analytics";
        return "monitoring";
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-border/20" style={{ boxShadow: "0 28px 70px rgba(0,0,0,0.14), 0 14px 32px rgba(0,0,0,0.1)" }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-background/80 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#B23A1E]/40" />
          <span className="h-3 w-3 rounded-full bg-[#FF9F1C]/40" />
          <span className="h-3 w-3 rounded-full bg-[#2ea043]/40" />
        </div>
        <div className="ml-3 flex-1 rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
          aply.local/dashboard
        </div>
        <Link href="/dashboard" className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20">
          <Icon name="link-external" size={10} /> Open
        </Link>
      </div>

      {/* Dashboard header bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon name="rocket" size={16} className="text-primary" />
          <span className="text-sm font-semibold">Aply</span>
          <span className="text-xs text-muted-foreground">Auto-application agent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-[#2ea043]/10 px-2 py-0.5 text-[10px] font-medium text-[#2ea043]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2ea043] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2ea043]" />
            </span>
            Live
          </span>
          {["monitoring", "approvals", "analytics"].map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s as typeof activeSection)}
              className={`rounded-md px-2 py-1 text-[10px] font-medium capitalize transition-colors ${
                activeSection === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard content - changes based on active section */}
      <div className="bg-background p-4 sm:p-5" style={{ minHeight: "340px" }}>
        <AnimatePresence mode="wait">
          {activeSection === "monitoring" && (
            <motion.div key="monitoring" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Platforms", value: "193", icon: "globe", color: "text-primary" },
                  { label: "Pending", value: "3", icon: "bell", color: "text-[#FF9F1C]" },
                  { label: "Offers", value: "47", icon: "pulse", color: "text-[#2ea043]" },
                  { label: "Submitted", value: "12", icon: "check", color: "text-muted-foreground" },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} className="rounded-xl bg-card p-2.5 ring-1 ring-border/30">
                    <div className="flex items-center gap-1">
                      <Icon name={stat.icon} size={10} className={stat.color} />
                      <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className={`mt-0.5 font-heading text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>
              {/* Recent offers list */}
              <div className="mt-3 rounded-xl bg-card p-3 ring-1 ring-border/30">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Recently detected</p>
                <div className="space-y-1.5">
                  {[
                    { company: "Lumio", title: "Senior Frontend Engineer", time: "2m ago", status: "pending" },
                    { company: "ParisLab", title: "Developpeur Full-Stack", time: "8m ago", status: "pending" },
                    { company: "Driftwood", title: "Full-Stack Engineer", time: "1h ago", status: "new" },
                  ].map((offer, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-2 rounded-lg bg-background/50 px-2 py-1.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-[9px] font-bold text-primary">{offer.company.slice(0, 2).toUpperCase()}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">{offer.title}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{offer.company} · {offer.time}</p>
                      </div>
                      <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${offer.status === "pending" ? "bg-[#FF9F1C]/15 text-[#FF9F1C]" : "bg-[#2ea043]/10 text-[#2ea043]"}`}>
                        {offer.status === "pending" ? "PENDING" : "NEW"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === "approvals" && (
            <motion.div key="approvals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Waiting for your approval</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { company: "Lumio", title: "Senior Frontend Engineer", score: 87, lang: "EN", platform: "Indeed" },
                  { company: "ParisLab", title: "Developpeur Full-Stack", score: 95, lang: "FR", platform: "WTTJ" },
                ].map((app, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-xl bg-card p-3 ring-1 ring-border/30">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-[9px] font-bold text-primary">{app.company.slice(0, 2).toUpperCase()}</span>
                        <div>
                          <p className="text-xs font-medium text-foreground">{app.title}</p>
                          <p className="text-[10px] text-muted-foreground">{app.company} · {app.platform}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg viewBox="0 0 36 36" className="h-7 w-7 -rotate-90">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="4" />
                          <motion.circle initial={{ strokeDasharray: "0 94.2" }} animate={{ strokeDasharray: `${(app.score / 100) * 94.2} 94.2` }} transition={{ delay: 0.3, duration: 0.6 }} cx="18" cy="18" r="15" fill="none" stroke={app.score >= 80 ? "#2ea043" : "#FF9F1C"} strokeWidth="4" strokeLinecap="round" />
                        </svg>
                        <span className="text-xs font-bold text-foreground">{app.score}%</span>
                      </div>
                    </div>
                    <div className="mt-2 rounded-md bg-background/60 p-2">
                      <p className="text-[10px] leading-relaxed text-muted-foreground">
                        {app.lang === "FR"
                          ? "Bonjour l'equipe " + app.company + ", votre offre ressonne particulierement avec ce que je cherche..."
                          : "Hi " + app.company + " team, your post stood out. I've spent the last few years shipping..."}
                      </p>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <span className="flex-1 rounded-md bg-primary py-1 text-center text-[10px] font-medium text-primary-foreground">Approve & submit</span>
                      <span className="rounded-md bg-muted px-2 py-1 text-center text-[10px] text-muted-foreground">Reject</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Total", value: "8", color: "text-primary" },
                  { label: "Response rate", value: "67%", color: "text-[#2ea043]" },
                  { label: "Avg quality", value: "85%", color: "text-[#FF9F1C]" },
                ].map((kpi, i) => (
                  <motion.div key={kpi.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} className="rounded-xl bg-card p-2.5 text-center ring-1 ring-border/30">
                    <p className={`font-heading text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
                  </motion.div>
                ))}
              </div>
              {/* Chart */}
              <div className="mt-3 rounded-xl bg-card p-3 ring-1 ring-border/30">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Weekly applications</p>
                <div className="flex h-24 items-end gap-1.5">
                  {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85].map((h, i) => (
                    <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }} className="flex-1 rounded-t-sm bg-primary/60" />
                  ))}
                </div>
              </div>
              {/* Status distribution */}
              <div className="mt-3 rounded-xl bg-card p-3 ring-1 ring-border/30">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Status distribution</p>
                <div className="flex h-3 overflow-hidden rounded-full">
                  <motion.div initial={{ width: 0 }} animate={{ width: "38%" }} transition={{ delay: 0.4 }} className="bg-[#2ea043]" />
                  <motion.div initial={{ width: 0 }} animate={{ width: "37%" }} transition={{ delay: 0.5 }} className="bg-[#FF9F1C]" />
                  <motion.div initial={{ width: 0 }} animate={{ width: "25%" }} transition={{ delay: 0.6 }} className="bg-[#B23A1E]" />
                </div>
                <div className="mt-1.5 flex justify-between text-[9px] text-muted-foreground">
                  <span>Submitted 38%</span>
                  <span>Pending 37%</span>
                  <span>Rejected 25%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
          <h2 className="mt-4 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Right-click. Capture. Apply.</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">Install the Aply extension. Browse any job board. Right-click on a job offer and Aply captures it instantly. Right-click on an application form and Aply fills every field.</p>
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
          <div className="overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-border/30">
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
              <motion.div initial={{ opacity: 0, scale: 0.8, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: -5 }} transition={{ duration: 0.2 }} className="absolute right-8 top-20 z-10 w-56 overflow-hidden rounded-xl bg-card shadow-2xl ring-1 ring-border/40">
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
