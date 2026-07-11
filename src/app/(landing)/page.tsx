"use client";
/**
 * Landing page for Aply - awwards-level design.
 *
 * Features:
 * - Floating rounded nav that detaches from top, becomes transparent on scroll
 * - Interactive dashboard preview in hero (animated mock)
 * - Extension right-click illustration section
 * - Original animations and layout
 */
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/aply/icon";

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
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = scrollY.on("change", (y) => setScrolled(y > 20));
    return () => unsub();
  }, [scrollY]);

  const heroY = useTransform(scrollY, [0, 400], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

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
              ? "bg-card/60 shadow-lg ring-1 ring-border/20 backdrop-blur-xl"
              : "bg-card/30 backdrop-blur-sm"
          }`}
        >
          <Link href="/" className="flex items-center gap-2">
            <Icon name="rocket" size={20} className="text-primary" />
            <span className="font-heading text-base font-semibold">Aply</span>
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            <a href="#features" className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
            <a href="#how" className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">How it works</a>
            <a href="#extension" className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">Extension</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Log in
            </Link>
            <Link href="/signup" className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent">
              Get started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero with dashboard preview */}
      <section ref={heroRef} className="relative overflow-hidden px-4 pt-32 pb-12 sm:px-6 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(60% 50% at 50% 0%, rgba(255,159,28,0.12) 0%, transparent 55%), radial-gradient(40% 40% at 80% 30%, rgba(198,93,0,0.06) 0%, transparent 50%)" }} />
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="mx-auto max-w-4xl text-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
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
            <Link href="/login" className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              I have an account
            </Link>
          </motion.div>
        </motion.div>

        {/* Interactive dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <DashboardPreview />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-20 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
              Everything you need to apply faster
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              No more manual form filling. No more generic cover letters. No more missed opportunities.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group flex flex-col gap-3"
              >
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
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
              Three steps to never miss a job
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative flex flex-col gap-3"
              >
                <span className="font-heading text-5xl font-bold text-primary/20">{step.num}</span>
                <h3 className="font-heading text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <Icon name="arrow-right" size={20} className="absolute -right-6 top-8 hidden text-border sm:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Extension section with right-click illustration */}
      <ExtensionSection />

      {/* CTA */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-36">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(40% 60% at 50% 100%, rgba(255,159,28,0.08) 0%, transparent 60%)" }} />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
            Ready to let Aply handle the grind?
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Set up your profile in 2 minutes. Aply starts scanning immediately.
          </p>
          <Link href="/signup" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-accent hover:shadow-primary/30">
            <Icon name="rocket" size={16} />
            Create your account
          </Link>
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
 * Interactive dashboard preview - animated mock showing
 * stat cards, a chart animation, and a pending approval card.
 */
function DashboardPreview() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveTab((t) => (t + 1) % 3);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-border/30">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-background/50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#B23A1E]/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF9F1C]/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2ea043]/30" />
        </div>
        <div className="ml-3 flex-1 rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
          aply.local/dashboard
        </div>
      </div>

      {/* Dashboard mock content */}
      <div className="p-4 sm:p-6">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Platforms", value: "193", color: "text-primary" },
            { label: "Pending", value: "3", color: "text-[#FF9F1C]" },
            { label: "Detected", value: "47", color: "text-[#2ea043]" },
            { label: "Submitted", value: "12", color: "text-muted-foreground" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="rounded-xl bg-background/60 p-2.5 sm:p-3"
            >
              <p className={`font-heading text-lg font-bold sm:text-2xl ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground sm:text-xs">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabbed content */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Approval card mock */}
          <motion.div
            key={`card-${activeTab}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl bg-background/60 p-3 ring-1 ring-border/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-primary/20" />
                <div>
                  <p className="text-xs font-medium text-foreground">Senior Frontend Engineer</p>
                  <p className="text-[10px] text-muted-foreground">Lumio · via Indeed</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="rounded-full bg-[#2ea043]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#2ea043]">87%</span>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "87%" }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="h-1.5 rounded-full bg-[#2ea043]"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Cover letter ready · 312 chars</p>
            </div>
            <div className="mt-2 flex gap-1.5">
              <span className="flex-1 rounded-md bg-primary py-1 text-center text-[10px] font-medium text-primary-foreground">Approve</span>
              <span className="rounded-md bg-muted px-2 py-1 text-center text-[10px] text-muted-foreground">Reject</span>
            </div>
          </motion.div>

          {/* Chart mock */}
          <div className="rounded-xl bg-background/60 p-3 ring-1 ring-border/30">
            <p className="mb-2 text-[10px] font-medium text-muted-foreground">Weekly applications</p>
            <div className="flex h-20 items-end gap-1">
              {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.7 + i * 0.08, duration: 0.4 }}
                  className="flex-1 rounded-t-sm bg-primary/60"
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[8px] text-muted-foreground">
              <span>W1</span><span>W2</span><span>W3</span><span>W4</span><span>W5</span><span>W6</span><span>W7</span>
            </div>
          </div>
        </div>

        {/* Activity bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-3 flex items-center gap-2 rounded-xl bg-background/60 px-3 py-2"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2ea043] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2ea043]" />
          </span>
          <p className="text-[10px] text-muted-foreground">Monitoring active · last scan 2 min ago · 2 new offers detected</p>
        </motion.div>
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
    const id = setInterval(() => {
      setShowMenu((s) => !s);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="extension" className="px-4 py-20 sm:px-6 sm:py-32">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* Left: text */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Icon name="rocket" size={11} />
            Chrome extension
          </span>
          <h2 className="mt-4 font-heading text-3xl font-semibold text-foreground sm:text-4xl">
            Right-click. Capture. Apply.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Install the Aply extension. Browse any job board. Right-click on a job offer and Aply captures it instantly. Right-click on an application form and Aply fills every field.
          </p>
          <ul className="mt-6 space-y-2">
            {[
              "Smart field detection (Greenhouse, Lever, Workday, Ashby)",
              "Fills name, email, phone, cover letter, custom questions",
              "Uses your browser sessions, no password sharing",
              "Download as .zip, load as unpacked extension",
            ].map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <Icon name="check" size={14} className="shrink-0 text-[#2ea043]" />
                {item}
              </motion.li>
            ))}
          </ul>
          <Link
            href="/api/extension/download"
            download="aply-extension.zip"
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-accent"
          >
            <Icon name="download" size={16} />
            Download extension
          </Link>
        </motion.div>

        {/* Right: right-click illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-border/30">
            {/* Fake job page */}
            <div className="border-b border-border bg-background/50 px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#B23A1E]/30" />
                  <span className="h-2 w-2 rounded-full bg-[#FF9F1C]/30" />
                  <span className="h-2 w-2 rounded-full bg-[#2ea043]/30" />
                </div>
                <span className="ml-2 text-xs text-muted-foreground">indeed.com/jobs</span>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <div className="h-3 w-2/3 rounded bg-muted" />
                <div className="h-2 w-1/2 rounded bg-muted/60" />
                <div className="h-2 w-3/4 rounded bg-muted/40" />
                <div className="h-2 w-2/3 rounded bg-muted/40" />
                <div className="mt-3 h-6 w-24 rounded-md bg-primary/20" />
              </div>
            </div>
          </div>

          {/* Right-click context menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -5 }}
                transition={{ duration: 0.2 }}
                className="absolute right-8 top-20 z-10 w-56 overflow-hidden rounded-xl bg-card shadow-2xl ring-1 ring-border/40"
              >
                <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Aply
                </div>
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary">
                  <Icon name="rocket" size={14} />
                  Capture this job offer
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
                  <Icon name="pencil" size={14} />
                  Auto-fill this form
                </div>
                <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                  Aply · Right-click anywhere
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cursor indicator */}
          <motion.div
            animate={{ x: [0, 40, 40, 0], y: [0, 30, 30, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-12 top-8 z-20"
          >
            <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
              <path d="M1 1L5 17L7.5 10.5L14 8L1 1Z" fill="#4A2F1A" stroke="#FFE4B5" strokeWidth="1" />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
