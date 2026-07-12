/**
 * Aply badges — soft theme tokens only (primary / accent / muted / destructive).
 * Categories stay distinguishable without leaving the brand palette.
 */
import { cn } from "@/lib/utils";

/** Shared soft pill shell */
const pill =
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-none";

const tone = {
  primary:
    "border-primary/30 bg-primary/10 text-primary",
  accent:
    "border-accent/40 bg-accent/15 text-foreground",
  secondary:
    "border-border bg-secondary text-secondary-foreground",
  muted:
    "border-border bg-muted text-muted-foreground",
  ink:
    "border-foreground/20 bg-foreground/5 text-foreground",
  danger:
    "border-destructive/30 bg-destructive/10 text-destructive",
  success:
    "border-[#2ea043]/35 bg-[#2ea043]/10 text-[#1f7a32] dark:text-[#7DCEA0]",
} as const;

const CATEGORY_TONE: Record<string, keyof typeof tone> = {
  generalist: "muted",
  freelance: "accent",
  remote: "primary",
  tech: "primary",
  startup: "accent",
  design: "secondary",
  regional_fr: "ink",
  regional_de: "ink",
  regional_other: "muted",
  niche: "muted",
};

const CATEGORY_LABEL: Record<string, string> = {
  generalist: "Generalist",
  freelance: "Freelance",
  remote: "Remote",
  tech: "Tech",
  startup: "Startup",
  design: "Design",
  regional_fr: "France",
  regional_de: "Deutschland",
  regional_other: "Regional",
  niche: "Niche",
};

export function CategoryBadge({ category }: { category: string }) {
  const t = CATEGORY_TONE[category] ?? "muted";
  return (
    <span className={cn(pill, tone[t])}>
      {CATEGORY_LABEL[category] ?? category}
    </span>
  );
}

const CONTRACT_TONE: Record<string, keyof typeof tone> = {
  "full-time": "primary",
  "part-time": "accent",
  internship: "secondary",
  freelance: "accent",
  remote: "ink",
};

const CONTRACT_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  internship: "Internship",
  freelance: "Freelance",
  remote: "Remote",
};

export function ContractBadge({ type }: { type: string }) {
  const t = CONTRACT_TONE[type] ?? "muted";
  return (
    <span
      className={cn(
        pill,
        "uppercase tracking-wide text-[10px]",
        tone[t]
      )}
    >
      {CONTRACT_LABEL[type] ?? type}
    </span>
  );
}

export function LangBadge({ lang }: { lang: string }) {
  const map: Record<string, string> = { en: "EN", fr: "FR", de: "DE" };
  return (
    <span
      className={cn(
        "inline-flex h-5 w-7 items-center justify-center rounded border text-[10px] font-semibold",
        tone.muted
      )}
    >
      {map[lang] ?? lang.toUpperCase()}
    </span>
  );
}

const STATUS_TONE: Record<string, keyof typeof tone> = {
  new: "accent",
  prepared: "secondary",
  pending_approval: "primary",
  applied: "success",
  rejected: "danger",
  skipped: "muted",
  draft: "muted",
  submitted: "success",
  importing: "accent",
};

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  prepared: "Prepared",
  pending_approval: "Waiting approval",
  applied: "Applied",
  rejected: "Rejected",
  skipped: "Skipped",
  draft: "Draft",
  submitted: "Submitted",
  importing: "Importing",
};

export function StatusBadge({ status }: { status: string }) {
  const t = STATUS_TONE[status] ?? "muted";
  return (
    <span className={cn(pill, tone[t])}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: string }) {
  const color =
    priority === "high"
      ? "bg-primary"
      : priority === "medium"
        ? "bg-accent"
        : "bg-border";
  return (
    <span
      className={cn("inline-block h-2 w-2 shrink-0 rounded-full", color)}
      aria-hidden
    />
  );
}

export function QualityRing({ score }: { score: number }) {
  const pct = Math.round((score ?? 0) * 100);
  const stroke =
    pct >= 80 ? "#2ea043" : pct >= 60 ? "var(--primary)" : "var(--destructive)";
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative h-7 w-7">
        <svg viewBox="0 0 36 36" className="h-7 w-7 -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="var(--border)"
            strokeWidth="4"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={stroke}
            strokeWidth="4"
            strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="font-heading text-sm font-semibold text-foreground">
        {pct}%
      </span>
    </div>
  );
}
