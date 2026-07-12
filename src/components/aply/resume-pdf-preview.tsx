"use client";
/**
 * Themed PDF preview · pdf.js chrome in Aply colors.
 * Fetches the resume as a Blob (no Range requests against the API).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/aply/icon";
import { useI18n } from "@/components/aply/i18n";
import { cn } from "@/lib/utils";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Props = {
  url: string;
  fileName?: string | null;
  className?: string;
};

const PDF_OPTIONS = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
} as const;

export function ResumePdfPreview({ url, fileName, className }: Props) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<Blob | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [width, setWidth] = useState(640);
  const [error, setError] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const next = Math.max(280, Math.floor(el.clientWidth - 32));
      setWidth(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingFile(true);
    setError(null);
    setFile(null);
    setPage(1);
    setNumPages(0);

    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        if (cancelled) return;
        setFile(new Blob([buffer], { type: "application/pdf" }));
      } catch (err) {
        console.error("[ResumePdfPreview] fetch", err);
        if (!cancelled) setError(t("resume.preview.loadFailed"));
      } finally {
        if (!cancelled) setLoadingFile(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, t]);

  const onLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setPage(1);
    setError(null);
  }, []);

  const onLoadError = useCallback(
    (err: Error) => {
      console.error("[ResumePdfPreview] document", err);
      setError(t("resume.preview.loadFailed"));
    },
    [t]
  );

  const pageWidth = useMemo(() => Math.floor(width * scale), [width, scale]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-[#F5E6C8] dark:bg-[#24160E]",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-card/90 px-2.5 py-1.5 dark:bg-[#3A2417]/90">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 px-0 text-muted-foreground hover:text-foreground"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <Icon name="chevron-left" size={14} />
          </Button>
          <span className="min-w-[4.5rem] text-center text-[11px] font-medium tabular-nums text-muted-foreground">
            {numPages > 0 ? `${page} / ${numPages}` : "—"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 px-0 text-muted-foreground hover:text-foreground"
            disabled={!numPages || page >= numPages}
            onClick={() => setPage((p) => Math.min(numPages, p + 1))}
            aria-label="Next page"
          >
            <Icon name="chevron-right" size={14} />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 px-0 text-muted-foreground hover:text-foreground"
            disabled={scale <= 0.7}
            onClick={() => setScale((s) => Math.max(0.7, Number((s - 0.1).toFixed(1))))}
            aria-label="Zoom out"
          >
            <Icon name="dash" size={14} />
          </Button>
          <span className="min-w-[2.75rem] text-center text-[11px] tabular-nums text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 px-0 text-muted-foreground hover:text-foreground"
            disabled={scale >= 1.6}
            onClick={() => setScale((s) => Math.min(1.6, Number((s + 0.1).toFixed(1))))}
            aria-label="Zoom in"
          >
            <Icon name="plus" size={14} />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="aply-scroll flex h-[min(70vh,720px)] justify-center overflow-auto p-4"
      >
        {error ? (
          <div className="flex flex-col items-center justify-center gap-2 self-center px-4 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="border-primary text-primary" asChild>
              <a href={url} target="_blank" rel="noreferrer">
                <Icon name="link-external" size={12} />
                {t("resume.preview.open")}
              </a>
            </Button>
          </div>
        ) : loadingFile || !file ? (
          <div className="w-full max-w-xl space-y-3 self-start">
            <Skeleton className="h-[480px] w-full rounded-sm" />
          </div>
        ) : (
          <Document
            file={file}
            loading={
              <div className="w-full max-w-xl space-y-3 self-start">
                <Skeleton className="h-[480px] w-full rounded-sm" />
              </div>
            }
            onLoadSuccess={onLoadSuccess}
            onLoadError={onLoadError}
            className="flex justify-center"
            options={PDF_OPTIONS}
          >
            <Page
              pageNumber={page}
              width={pageWidth}
              loading={<Skeleton className="h-[480px] w-full max-w-xl rounded-sm" />}
              className="overflow-hidden rounded-sm shadow-[0_8px_28px_-12px_rgba(74,47,26,0.45)] ring-1 ring-[#C65D00]/20 dark:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.55)] dark:ring-[#FF9F1C]/25 [&_canvas]:bg-white"
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        )}
      </div>

      {fileName ? (
        <p className="truncate border-t border-border/80 bg-card/70 px-3 py-1.5 text-[10px] text-muted-foreground dark:bg-[#3A2417]/70">
          {fileName}
        </p>
      ) : null}
    </div>
  );
}
