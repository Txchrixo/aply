"use client";
/**
 * Onboarding platforms picker — login boards Connect via Playwright persistent
 * profiles; no-login boards already checked as managed.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/aply/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Platform, PlatformListResponse } from "@/components/aply/types";
import { PlatformLogo } from "@/components/aply/platform-logo";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;
const MIN_LOAD_MORE_MS = 450;

type LoginFilter = "all" | "login" | "managed";
type SessionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "waiting_captcha"
  | "error";

type OnboardingPlatformsResponse = PlatformListResponse & {
  loginCount?: number;
  managedCount?: number;
};

type SessionInfo = {
  platformId: string;
  status: SessionStatus;
  lastError?: string | null;
};

function LoadMoreSkeleton() {
  return (
    <div
      className="border-t border-border bg-muted/20 px-3 py-3"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mb-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Icon name="sync" size={14} className="animate-spin" />
        Loading more platforms…
      </div>
      <ul className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="h-8 w-8 shrink-0 animate-pulse rounded-md bg-muted" />
            <span className="min-w-0 flex-1 space-y-1.5">
              <span className="block h-3 w-2/5 animate-pulse rounded bg-muted" />
              <span className="block h-2.5 w-1/4 animate-pulse rounded bg-muted" />
            </span>
            <span className="h-7 w-16 shrink-0 animate-pulse rounded-md bg-muted" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ManagedCheck() {
  return (
    <span className="shrink-0 text-xs font-medium text-muted-foreground">
      Managed
    </span>
  );
}

export function OnboardingPlatformsList() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [loginFilter, setLoginFilter] = useState<LoginFilter>("all");
  const [items, setItems] = useState<Platform[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loginCount, setLoginCount] = useState(0);
  const [managedCount, setManagedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sessions, setSessions] = useState<Record<string, SessionInfo>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const itemsRef = useRef<Platform[]>([]);
  const prevCountRef = useRef(0);

  itemsRef.current = items;

  const refreshSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/browser/sessions");
      const data = await res.json();
      const map: Record<string, SessionInfo> = {};
      for (const s of data.items ?? []) {
        map[s.platformId] = {
          platformId: s.platformId,
          status: s.status,
          lastError: s.lastError,
        };
      }
      setSessions(map);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refreshSessions();
    const t = setInterval(refreshSessions, 4000);
    return () => clearInterval(t);
  }, [refreshSessions]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const fetchPage = useCallback(
    async (pageNum: number, query: string, filter: LoginFilter, append: boolean) => {
      if (append) {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        prevCountRef.current = itemsRef.current.length;
        setLoadingMore(true);
        await new Promise((r) => requestAnimationFrame(() => r(undefined)));
      } else {
        prevCountRef.current = 0;
        setLoading(true);
      }

      const started = Date.now();
      try {
        const params = new URLSearchParams({
          onboarding: "true",
          page: String(pageNum),
          pageSize: String(PAGE_SIZE),
        });
        if (query) params.set("q", query);
        if (filter === "login") params.set("loginRequired", "true");
        if (filter === "managed") params.set("loginRequired", "false");
        const res = await fetch(`/api/platforms?${params}`);
        const data = (await res.json()) as OnboardingPlatformsResponse;

        if (append) {
          const elapsed = Date.now() - started;
          if (elapsed < MIN_LOAD_MORE_MS) {
            await new Promise((r) => setTimeout(r, MIN_LOAD_MORE_MS - elapsed));
          }
          setItems((prev) => [...prev, ...data.items]);
        } else {
          setItems(data.items);
        }
        setPage(data.page);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setLoginCount(data.loginCount ?? 0);
        setManagedCount(data.managedCount ?? 0);
      } catch {
        if (!append) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    fetchPage(1, debouncedQ, loginFilter, false);
  }, [debouncedQ, loginFilter, fetchPage]);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries[0]?.isIntersecting;
        if (!hit || loading || loadingMoreRef.current || page >= totalPages) return;
        fetchPage(page + 1, debouncedQ, loginFilter, true);
      },
      { root, rootMargin: "40px", threshold: 0.1 }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [page, totalPages, loading, debouncedQ, loginFilter, fetchPage]);

  const captchaWaiting = Object.values(sessions).some(
    (s) => s.status === "waiting_captcha"
  );

  const handleConnect = async (platformId: string) => {
    setBusyId(platformId);
    try {
      const res = await fetch("/api/browser/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error || "Could not open browser");
      } else {
        toast.message("Browser opened", {
          description:
            "Shared profile — sign in to Google once if needed, then log in here and click “I’ve logged in”.",
        });
      }
      await refreshSessions();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Connect failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirm = async (platformId: string) => {
    setBusyId(platformId);
    try {
      const res = await fetch("/api/browser/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error || "Confirm failed");
      } else {
        toast.success("Platform connected");
      }
      await refreshSessions();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Confirm failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      {captchaWaiting && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <Icon name="alert" size={14} className="shrink-0" />
          CAPTCHA detected in a connect window — solve it there, then confirm.
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Icon
            name="search"
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search platforms…"
            className="touch-target pl-9"
          />
        </div>
        <Select
          value={loginFilter}
          onValueChange={(v) => setLoginFilter(v as LoginFilter)}
        >
          <SelectTrigger className="w-[10.5rem] shrink-0 touch-target sm:w-[12.5rem]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            <SelectItem value="login">Needs login</SelectItem>
            <SelectItem value="managed">No login needed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        ref={scrollRef}
        className="h-72 overflow-y-auto rounded-lg border border-border bg-card"
      >
        {loading && items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Icon name="sync" size={18} className="animate-spin" />
            Loading platforms…
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No platforms match.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((platform, index) => {
              const isNew = index >= prevCountRef.current && prevCountRef.current > 0;
              const session = sessions[platform.id];
              const status = session?.status;
              const busy = busyId === platform.id;

              return (
                <li
                  key={platform.id}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3 py-2.5",
                    isNew && "animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                        !platform.hasLoginRequired || status === "connected"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background"
                      )}
                      title={
                        !platform.hasLoginRequired
                          ? "Already managed"
                          : status === "connected"
                            ? "Connected"
                            : "Login required"
                      }
                    >
                      {(!platform.hasLoginRequired || status === "connected") && (
                        <Icon name="check" size={12} />
                      )}
                    </span>
                    <PlatformLogo url={platform.url} name={platform.name} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{platform.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {platform.category.replace(/_/g, " ")}
                        {status === "connecting" && " · connecting…"}
                        {status === "waiting_captcha" && " · captcha"}
                        {status === "connected" && " · connected"}
                        {status === "error" && " · error"}
                      </p>
                    </div>
                  </div>

                  {!platform.hasLoginRequired ? (
                    <ManagedCheck />
                  ) : (
                    <div className="flex shrink-0 items-center gap-1.5">
                      {(status === "connecting" ||
                        status === "waiting_captcha") && (
                        <Button
                          variant="default"
                          size="sm"
                          className="text-xs"
                          disabled={busy}
                          onClick={() => handleConfirm(platform.id)}
                        >
                          I&apos;ve logged in
                        </Button>
                      )}
                      {status === "connected" ? (
                        <span className="text-xs font-medium text-primary">
                          Connected
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          disabled={busy}
                          onClick={() => handleConnect(platform.id)}
                        >
                          {busy ? (
                            <Icon name="sync" size={12} className="animate-spin" />
                          ) : (
                            <Icon name="link-external" size={12} />
                          )}
                          Connect
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {loadingMore && <LoadMoreSkeleton />}

        {page < totalPages && !loading && items.length > 0 && (
          <div ref={sentinelRef} className="h-8" aria-hidden />
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {loginFilter === "login"
          ? `${total} need login`
          : loginFilter === "managed"
            ? `${total} managed`
            : `${loginCount} need login · ${managedCount} managed`}
        {debouncedQ ? " · filtered" : ""}
        {items.length > 0 && items.length < total ? ` · showing ${items.length}` : ""}
      </p>
    </div>
  );
}
