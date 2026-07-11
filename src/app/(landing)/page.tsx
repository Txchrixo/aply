"use client";
/**
 * Landing page for Aply - marketing page with hero, features, CTA.
 * This is what non-authenticated users see at /.
 */
import Link from "next/link";
import { motion } from "framer-motion";
import { Icon } from "@/components/aply/icon";

const FEATURES = [
  {
    icon: "pulse",
    title: "24/7 monitoring",
    desc: "Aply watches 190+ job boards and company career pages around the clock. New offers are detected and imported automatically.",
  },
  {
    icon: "pencil",
    title: "Authentic drafts",
    desc: "Cover letters written in your voice, grounded in your resume. No AI-tell phrases, no generic templates. Every draft passes quality checks.",
  },
  {
    icon: "comment-discussion",
    title: "Approve before submit",
    desc: "Aply never submits without your green light. Get a WhatsApp or email notification, review the draft, approve with one tap.",
  },
  {
    icon: "globe",
    title: "Career page first",
    desc: "When a job is found on a job board, Aply checks the company's career page and prefers applying directly. No middleman when avoidable.",
  },
  {
    icon: "diff",
    title: "Form variation handling",
    desc: "Each platform asks for different info. Aply detects the required fields, answers custom questions, and fills everything correctly.",
  },
  {
    icon: "shield-lock",
    title: "Local-first",
    desc: "Your data stays on your machine. No cloud, no tracking. Aply runs locally and uses your own browser sessions.",
  },
];

const STEPS = [
  { num: "01", title: "Sign up", desc: "Create your account and onboard with your resume, emails, and preferences." },
  { num: "02", title: "Install extension", desc: "Add the Aply Chrome extension. Right-click any job page to capture it." },
  { num: "03", title: "Approve drafts", desc: "Aply scans, detects, and drafts. You approve via WhatsApp or email. Done." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Icon name="rocket" size={22} className="text-primary" />
            <span className="font-heading text-lg font-semibold">Aply</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Log in
            </Link>
            <Link href="/signup" className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(50% 50% at 50% 0%, rgba(255,159,28,0.12) 0%, transparent 60%)" }} />
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Icon name="zap" size={11} className="text-primary" />
              Local-first · 24/7 monitoring · Authentic drafts
            </span>
            <h1 className="mt-6 font-heading text-4xl font-semibold leading-[1.1] text-foreground sm:text-5xl md:text-6xl">
              Apply to every job that fits.{" "}
              <span className="aply-gradient-text">Aply writes, you approve.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Aply watches 190+ job boards around the clock, drafts authentic cover letters in your voice, and asks for your green light before every single submission.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-accent hover:shadow-md">
                <Icon name="rocket" size={16} />
                Start free
              </Link>
              <Link href="/login" className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                I have an account
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">Everything you need to apply faster</h2>
            <p className="mt-3 text-muted-foreground">No more manual form filling. No more generic cover letters. No more missed opportunities.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.05 }} className="flex flex-col gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name={f.icon} size={18} />
                </span>
                <h3 className="font-heading text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/50 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">Three steps to never miss a job</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.num} className="flex flex-col gap-2">
                <span className="font-heading text-3xl font-bold text-primary/30">{step.num}</span>
                <h3 className="font-heading text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">Ready to let Aply handle the grind?</h2>
          <p className="mt-4 text-muted-foreground">Set up your profile in 2 minutes. Aply starts scanning immediately.</p>
          <Link href="/signup" className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-accent hover:shadow-md">
            <Icon name="rocket" size={16} />
            Create your account
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="rocket" size={18} className="text-primary" />
            <span className="font-heading font-semibold">Aply</span>
          </div>
          <p className="text-xs text-muted-foreground">Local-first · No data leaves your machine</p>
        </div>
      </footer>
    </div>
  );
}
