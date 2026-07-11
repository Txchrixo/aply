"use client";
/**
 * Pagination - reusable, responsive pagination component.
 * Shows: Prev | page numbers (with ellipsis) | Next
 * Mobile: compact (Prev/Next + current page indicator)
 */
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/aply/icon";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build page numbers with ellipsis
  const pages: (number | "...")[] = [];
  const add = (n: number | "...") => pages.push(n);

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) add(i);
  } else {
    add(1);
    if (page > 3) add("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      add(i);
    }
    if (page < totalPages - 2) add("...");
    add(totalPages);
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        className
      )}
    >
      {/* Mobile: compact */}
      <div className="flex items-center gap-2 sm:hidden">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="touch-target border-border px-3"
          aria-label="Previous page"
        >
          <Icon name="arrow-left" size={14} />
        </Button>
        <span className="flex-1 text-center text-sm text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="touch-target border-border px-3"
          aria-label="Next page"
        >
          <Icon name="arrow-right" size={14} />
        </Button>
      </div>

      {/* Desktop: full */}
      <div className="hidden items-center gap-1 sm:flex">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="gap-1.5 border-border"
        >
          <Icon name="arrow-left" size={14} />
          Prev
        </Button>
        <div className="flex items-center gap-1">
          {pages.map((p, i) =>
            p === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="px-2 text-sm text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors",
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            )
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="gap-1.5 border-border"
        >
          Next
          <Icon name="arrow-right" size={14} />
        </Button>
      </div>
    </div>
  );
}
