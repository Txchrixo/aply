"use client";
/**
 * SectionHeading · consistent Fraunces h2 + muted subtitle for each section.
 */
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  id: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  id,
  title,
  subtitle,
  eyebrow,
  className,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow && (
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#C65D00]">
          <span className="h-px w-6 bg-[#C65D00]/40" aria-hidden />
          {eyebrow}
        </span>
      )}
      <h2
        id={id}
        className="font-heading text-3xl font-semibold leading-tight text-[#4A2F1A] md:text-4xl"
      >
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-2xl text-base text-[#79695E]">{subtitle}</p>
      )}
    </div>
  );
}
