"use client";
/**
 * Platform favicon from site URL (Google s2 favicons) with globe fallback.
 */
import { useState } from "react";
import { Icon } from "@/components/aply/icon";
import { cn } from "@/lib/utils";

export function platformFaviconUrl(siteUrl: string, size = 64): string | null {
  try {
    const host = new URL(siteUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`;
  } catch {
    return null;
  }
}

export function PlatformLogo({
  url,
  name,
  size = 32,
  className,
}: {
  url: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = platformFaviconUrl(url, size <= 24 ? 32 : 64);

  if (!src || failed) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground",
          className
        )}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <Icon name="globe" size={Math.max(12, Math.round(size * 0.45))} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name ? `${name} logo` : ""}
      width={size}
      height={size}
      className={cn(
        "shrink-0 rounded-md bg-muted object-contain p-1",
        className
      )}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}
