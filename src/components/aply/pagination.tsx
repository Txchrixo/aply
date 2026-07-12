"use client";
/**
 * Pagination — compact segmented control (dashboard style).
 */
import { Icon } from "@/components/aply/icon";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Optional summary shown opposite the controls when align is between */
  summary?: string;
  /** start = left, end = right, between = summary left + controls right */
  align?: "start" | "end" | "between";
}

function buildPages(page: number, totalPages: number): (number | "…")[] {
  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (page > 3) pages.push("…");
  for (
    let i = Math.max(2, page - 1);
    i <= Math.min(totalPages - 1, page + 1);
    i++
  ) {
    pages.push(i);
  }
  if (page < totalPages - 2) pages.push("…");
  pages.push(totalPages);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
  summary,
  align = "between",
}: PaginationProps) {
  if (totalPages <= 1) {
    if (!summary) return null;
    return (
      <p
        className={cn(
          "text-xs text-muted-foreground",
          align === "end" && "text-right",
          className
        )}
      >
        {summary}
      </p>
    );
  }

  const pages = buildPages(page, totalPages);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        align === "start" && "justify-start",
        align === "end" && "justify-end",
        align === "between" && "justify-between",
        className
      )}
    >
      {summary && align === "between" ? (
        <p className="text-xs text-muted-foreground">{summary}</p>
      ) : null}

      {!summary && align !== "between" ? (
        <span className="text-xs tabular-nums text-muted-foreground sm:hidden">
          {page} / {totalPages}
        </span>
      ) : null}

      <nav
        aria-label="Pagination"
        className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-card"
      >
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className={cn(
            "flex h-8 items-center gap-1 border-r border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          )}
        >
          <Icon name="chevron-left" size={14} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="hidden items-stretch sm:flex">
          {pages.map((p, i) =>
            p === "…" ? (
              <span
                key={`e-${i}`}
                className="flex h-8 w-8 items-center justify-center border-r border-border text-xs text-muted-foreground last:border-r-0"
                aria-hidden
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "flex h-8 min-w-8 items-center justify-center border-r border-border px-2 text-xs font-medium tabular-nums transition-colors last:border-r-0",
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {p}
              </button>
            )
          )}
        </div>

        <span className="flex h-8 items-center border-r border-border px-3 text-xs tabular-nums text-foreground sm:hidden">
          {page}
          <span className="mx-1 text-muted-foreground">/</span>
          {totalPages}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className={cn(
            "flex h-8 items-center gap-1 px-2.5 text-xs font-medium text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          )}
        >
          <span className="hidden sm:inline">Next</span>
          <Icon name="chevron-right" size={14} />
        </button>
      </nav>
    </div>
  );
}
