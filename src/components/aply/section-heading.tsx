"use client";
/**
 * SectionHeading - clean section header without decorative lines.
 * Uses spacing and typography hierarchy instead of borders.
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
        "flex flex-col gap-1.5",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          {eyebrow}
        </span>
      )}
      <h2
        id={id}
        className="font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl md:text-4xl"
      >
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}
