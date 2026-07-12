"use client";
/**
 * SectionHeading — panel titles for the app shell (compact by default).
 */
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  id: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  className?: string;
  align?: "left" | "center";
  /** Marketing-style large heading. Dashboard uses compact. */
  compact?: boolean;
}

export function SectionHeading({
  id,
  title,
  subtitle,
  eyebrow,
  className,
  align = "left",
  compact = true,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col",
        compact ? "gap-0.5" : "gap-1.5",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow && !compact && (
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          {eyebrow}
        </span>
      )}
      <h2
        id={id}
        className={cn(
          "font-heading font-semibold leading-tight text-foreground",
          compact ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl md:text-4xl"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "max-w-2xl text-muted-foreground",
            compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
