/**
 * Small shared UI helpers for Aply dashboard.
 * Pure presentational components following the design.md palette.
 */
import { cn } from "@/lib/utils";

const CATEGORY_STYLES: Record<string, string> = {
  generalist: "bg-[#FFE4B5] text-[#C65D00] border-[#C65D00]/30",
  freelance: "bg-[#FF9F1C]/15 text-[#C65D00] border-[#FF9F1C]/40",
  remote: "bg-[#8B4513]/10 text-[#8B4513] border-[#8B4513]/30",
  tech: "bg-[#C65D00]/12 text-[#C65D00] border-[#C65D00]/30",
  startup: "bg-[#FF9F1C]/20 text-[#4A2F1A] border-[#FF9F1C]/50",
  design: "bg-[#A0522D]/12 text-[#A0522D] border-[#A0522D]/30",
  regional_fr: "bg-[#C65D00]/10 text-[#4A2F1A] border-[#C65D00]/30",
  regional_de: "bg-[#D2691E]/12 text-[#4A2F1A] border-[#D2691E]/30",
  regional_other: "bg-[#79695E]/12 text-[#4A2F1A] border-[#79695E]/30",
  niche: "bg-[#FFE4B5] text-[#79695E] border-[#CFC5BE]",
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
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-none",
        CATEGORY_STYLES[category] ?? CATEGORY_STYLES.niche
      )}
    >
      {CATEGORY_LABEL[category] ?? category}
    </span>
  );
}

const CONTRACT_STYLES: Record<string, string> = {
  "full-time": "bg-[#C65D00] text-[#FFE4B5]",
  "part-time": "bg-[#FF9F1C] text-[#4A2F1A]",
  internship: "bg-[#8B4513] text-[#FFE4B5]",
  freelance: "bg-[#D2691E] text-[#FFE4B5]",
  remote: "bg-[#4A2F1A] text-[#FFE4B5]",
};

const CONTRACT_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  internship: "Internship",
  freelance: "Freelance",
  remote: "Remote",
};

export function ContractBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide leading-none",
        CONTRACT_STYLES[type] ?? "bg-[#FFE4B5] text-[#79695E]"
      )}
    >
      {CONTRACT_LABEL[type] ?? type}
    </span>
  );
}

export function LangBadge({ lang }: { lang: string }) {
  const map: Record<string, string> = {
    en: "EN",
    fr: "FR",
    de: "DE",
  };
  return (
    <span className="inline-flex h-5 w-7 items-center justify-center rounded border border-[#CFC5BE] bg-[#FFF4DC] text-[10px] font-semibold text-[#4A2F1A]">
      {map[lang] ?? lang.toUpperCase()}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-[#FF9F1C]/15 text-[#C65D00] border-[#FF9F1C]/40",
  prepared: "bg-[#8B4513]/10 text-[#8B4513] border-[#8B4513]/30",
  pending_approval: "bg-[#C65D00]/15 text-[#C65D00] border-[#C65D00]/40",
  applied: "bg-[#2ea043]/12 text-[#2ea043] border-[#2ea043]/30",
  rejected: "bg-[#B23A1E]/10 text-[#B23A1E] border-[#B23A1E]/30",
  skipped: "bg-[#79695E]/12 text-[#79695E] border-[#79695E]/30",
  draft: "bg-[#FFE4B5] text-[#79695E] border-[#CFC5BE]",
  submitted: "bg-[#2ea043]/12 text-[#2ea043] border-[#2ea043]/30",
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
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-none",
        STATUS_STYLES[status] ?? STATUS_STYLES.draft
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: string }) {
  const color =
    priority === "high"
      ? "#C65D00"
      : priority === "medium"
      ? "#FF9F1C"
      : "#CFC5BE";
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

export function QualityRing({ score }: { score: number }) {
  const pct = Math.round((score ?? 0) * 100);
  const color = pct >= 80 ? "#2ea043" : pct >= 60 ? "#C65D00" : "#B23A1E";
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative h-7 w-7">
        <svg viewBox="0 0 36 36" className="h-7 w-7 -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="#CFC5BE"
            strokeWidth="4"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="font-heading text-sm font-semibold text-[#4A2F1A]">
        {pct}%
      </span>
    </div>
  );
}
