"use client";
/**
 * PlatformsSection · filterable, paginated list of monitored platforms.
 * Includes an "Add platform" dialog that POSTs to /api/platforms.
 */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/components/aply/icon";
import { SectionHeading } from "@/components/aply/section-heading";
import { PlatformDetailDrawer } from "@/components/aply/platform-detail-drawer";
import { PlatformLogo } from "@/components/aply/platform-logo";
import { Pagination } from "@/components/aply/pagination";
import { hasRssFeed } from "@/lib/rss-feeds";
import {
  CategoryBadge,
  PriorityDot,
} from "@/components/aply/badges";
import type {
  Platform,
  PlatformListResponse,
} from "@/components/aply/types";
import { apiFetch } from "@/components/aply/utils";
import { useI18n } from "@/components/aply/i18n";

const CATEGORY_VALUES = [
  "all",
  "generalist",
  "freelance",
  "remote",
  "tech",
  "startup",
  "design",
  "regional_fr",
  "regional_de",
  "regional_other",
  "niche",
] as const;

const PRIORITY_VALUES = ["high", "medium", "low"] as const;

const LANGS = ["en", "fr", "de"] as const;
const CONTRACT_TYPES = ["full-time", "part-time", "internship", "freelance", "remote"] as const;

interface PlatformCardProps {
  platform: Platform;
  sessionStatus?: string | null;
  onToggle: (id: string, next: boolean) => void;
  onClick: (id: string) => void;
  onConnect?: (id: string) => void;
  onConfirm?: (id: string) => void;
  connecting?: boolean;
}

function PlatformRow({
  platform,
  sessionStatus,
  onToggle,
  onClick,
  onConnect,
  onConfirm,
  connecting,
}: PlatformCardProps) {
  const { t } = useI18n();
  return (
    <li
      onClick={() => onClick(platform.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(platform.id);
        }
      }}
      aria-label={`View details for ${platform.name}`}
      className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40"
    >
      <PlatformLogo url={platform.url} name={platform.name} size={28} />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <PriorityDot priority={platform.priority} />
          <span className="truncate text-sm font-medium text-foreground">
            {platform.name}
          </span>
          <CategoryBadge category={platform.category} />
          {platform.hasLoginRequired && (
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Icon name="shield-lock" size={10} />
              {t("platforms.login")}
            </span>
          )}
          {platform.hasAntiBot && (
            <span className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
              <Icon name="alert" size={10} />
              {t("platforms.antibot")}
            </span>
          )}
          {hasRssFeed(platform.name) && (
            <span
              className="inline-flex items-center gap-1 rounded-md border border-accent/40 bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-foreground"
              title={t("platforms.rssTooltip")}
            >
              <Icon name="rss" size={10} />
              RSS
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground" title={platform.url}>
          {platform.url.replace(/^https?:\/\//, "")}
        </p>
      </div>

      <div
        className="flex shrink-0 flex-wrap items-center justify-end gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px]" asChild>
          <a
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("platforms.aria.openInNewTab").replace("{name}", platform.name)}
          >
            <Icon name="link-external" size={12} />
            {t("platforms.action.open")}
          </a>
        </Button>

        {platform.hasLoginRequired && onConnect && (
          <>
            {sessionStatus === "connected" ? (
              <span className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[#2ea043]/35 bg-[#2ea043]/10 px-2.5 text-[11px] font-medium text-[#1f7a32] dark:text-[#7DCEA0]">
                <Icon name="check" size={12} />
                {t("platforms.action.connected")}
              </span>
            ) : (
              <>
                {(sessionStatus === "connecting" ||
                  sessionStatus === "waiting_captcha") &&
                  onConfirm && (
                    <Button
                      size="sm"
                      className="h-7 text-[11px]"
                      disabled={connecting}
                      onClick={() => onConfirm(platform.id)}
                    >
                      {t("platforms.action.loggedIn")}
                    </Button>
                  )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-[11px]"
                  disabled={connecting}
                  onClick={() => onConnect(platform.id)}
                >
                  {connecting || sessionStatus === "connecting" ? (
                    <Icon name="sync" size={12} className="animate-spin" />
                  ) : (
                    <Icon name="key" size={12} />
                  )}
                  {sessionStatus === "waiting_captcha"
                    ? "Captcha"
                    : t("platforms.action.connect")}
                </Button>
              </>
            )}
          </>
        )}

        <label
          className="inline-flex h-7 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-2 text-[11px] font-medium text-foreground"
          title={t("platforms.aria.toggle").replace("{name}", platform.name)}
        >
          <span className={platform.enabled ? undefined : "text-muted-foreground"}>
            {platform.enabled
              ? t("platforms.action.monitoringOn")
              : t("platforms.action.monitoringOff")}
          </span>
          <Switch
            checked={platform.enabled}
            onCheckedChange={(v) => onToggle(platform.id, v)}
            aria-label={t("platforms.aria.toggle").replace("{name}", platform.name)}
          />
        </label>
      </div>
    </li>
  );
}

interface AddPlatformDialogProps {
  onCreated: () => void;
}

function AddPlatformDialog({ onCreated }: AddPlatformDialogProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("niche");
  const [langs, setLangs] = useState<string[]>(["en"]);
  const [contracts, setContracts] = useState<string[]>(["full-time", "remote"]);
  const [hasLogin, setHasLogin] = useState(false);
  const [hasAntiBot, setHasAntiBot] = useState(false);
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setUrl("");
    setCategory("niche");
    setLangs(["en"]);
    setContracts(["full-time", "remote"]);
    setHasLogin(false);
    setHasAntiBot(false);
    setPriority("medium");
  };

  const toggleArr = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const handleSubmit = async () => {
    if (!name || !url) {
      toast.error(t("platforms.dialog.nameRequired"));
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/platforms", {
        method: "POST",
        body: JSON.stringify({
          name,
          url,
          category,
          languages: langs,
          contractTypes: contracts,
          hasLoginRequired: hasLogin,
          hasAntiBot,
          priority,
          enabled: true,
        }),
      });
      toast.success(`${name} ${t("platforms.toast.addedSuffix")}`);
      reset();
      setOpen(false);
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("platforms.toast.addFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-[#C65D00] text-[#C65D00] hover:bg-[#FFE4B5]"
        >
          <Icon name="plus" size={14} />
          {t("platforms.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#FFF4DC] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-[#4A2F1A]">
            {t("platforms.dialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("platforms.dialog.desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="pf-name">{t("platforms.dialog.name")}</Label>
            <Input
              id="pf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("platforms.dialog.namePlaceholder")}
              className="bg-[#FFE4B5]"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pf-url">{t("platforms.dialog.url")}</Label>
            <Input
              id="pf-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("platforms.dialog.urlPlaceholder")}
              className="bg-[#FFE4B5]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>{t("platforms.dialog.category")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full bg-[#FFE4B5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_VALUES.filter((c) => c !== "all").map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`platforms.category.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("platforms.dialog.priority")}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full bg-[#FFE4B5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_VALUES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {t(`platforms.priority.${p}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>{t("platforms.dialog.languages")}</Label>
            <div className="flex flex-wrap gap-3">
              {LANGS.map((l) => (
                <div key={l} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`pf-lang-${l}`}
                    checked={langs.includes(l)}
                    onCheckedChange={() => setLangs((a) => toggleArr(a, l))}
                  />
                  <Label htmlFor={`pf-lang-${l}`} className="text-sm font-normal">
                    {l.toUpperCase()}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>{t("platforms.dialog.contractTypes")}</Label>
            <div className="flex flex-wrap gap-3">
              {CONTRACT_TYPES.map((c) => (
                <div key={c} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`pf-ct-${c}`}
                    checked={contracts.includes(c)}
                    onCheckedChange={() => setContracts((a) => toggleArr(a, c))}
                  />
                  <Label htmlFor={`pf-ct-${c}`} className="text-sm font-normal capitalize">
                    {c.replace("-", " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-md border border-[#CFC5BE] bg-[#FFE4B5] px-3 py-2">
              <Label htmlFor="pf-login" className="text-sm font-normal">
                {t("platforms.dialog.loginRequired")}
              </Label>
              <Switch
                id="pf-login"
                checked={hasLogin}
                onCheckedChange={setHasLogin}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-[#CFC5BE] bg-[#FFE4B5] px-3 py-2">
              <Label htmlFor="pf-antibot" className="text-sm font-normal">
                {t("platforms.dialog.antiBot")}
              </Label>
              <Switch
                id="pf-antibot"
                checked={hasAntiBot}
                onCheckedChange={setHasAntiBot}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#C65D00] text-[#FFE4B5] hover:bg-[#FF9F1C] hover:text-[#4A2F1A]"
          >
            {saving ? (
              <Icon name="sync" size={14} className="animate-spin" />
            ) : (
              <Icon name="plus" size={14} />
            )}
            {t("platforms.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PlatformsSection() {
  const { t } = useI18n();
  const [items, setItems] = useState<Platform[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [enabledOnly, setEnabledOnly] = useState(false);
  const [loginFilter, setLoginFilter] = useState<"all" | "login" | "no_login">(
    "all"
  );
  const [connectionFilter, setConnectionFilter] = useState<
    "all" | "connected" | "not_connected"
  >("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sessions, setSessions] = useState<Record<string, string>>({});
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleCardClick = (id: string) => {
    setDrawerId(id);
    setDrawerOpen(true);
  };

  const refreshSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/browser/sessions");
      const data = await res.json();
      const map: Record<string, string> = {};
      for (const s of data.items ?? []) {
        map[s.platformId] = s.status;
      }
      setSessions(map);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refreshSessions();
    const t = setInterval(refreshSessions, 5000);
    return () => clearInterval(t);
  }, [refreshSessions]);

  const handleConnect = async (id: string) => {
    setConnectingId(id);
    try {
      const res = await fetch("/api/browser/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformId: id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) toast.error(data.error || "Connect failed");
      else
        toast.message("Browser opened", {
          description:
            "Shared profile — Google once if needed, then log in and click “I’ve logged in”.",
        });
      await refreshSessions();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Connect failed");
    } finally {
      setConnectingId(null);
    }
  };

  const handleConfirm = async (id: string) => {
    setConnectingId(id);
    try {
      const res = await fetch("/api/browser/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformId: id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) toast.error(data.error || "Confirm failed");
      else toast.success("Platform connected");
      await refreshSessions();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Confirm failed");
    } finally {
      setConnectingId(null);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "24",
      });
      if (category !== "all") params.set("category", category);
      if (q) params.set("q", q);
      if (enabledOnly) params.set("enabled", "true");
      if (loginFilter === "login") params.set("loginRequired", "true");
      if (loginFilter === "no_login") params.set("loginRequired", "false");
      if (connectionFilter === "connected") params.set("sessionStatus", "connected");
      if (connectionFilter === "not_connected")
        params.set("sessionStatus", "not_connected");
      const res = await apiFetch<PlatformListResponse>(
        `/api/platforms?${params.toString()}`
      );
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e) {
      toast.error(t("platforms.toast.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [page, category, q, enabledOnly, loginFilter, connectionFilter]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const handleToggle = async (id: string, next: boolean) => {
    setTogglingId(id);
    // optimistic update
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: next } : p))
    );
    try {
      await apiFetch(`/api/platforms/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: next }),
      });
      toast.success(
        next ? t("platforms.toast.toggleEnabled") : t("platforms.toast.togglePaused")
      );
    } catch (e) {
      // revert
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, enabled: !next } : p))
      );
      toast.error(t("platforms.toast.toggleFailed"));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <section
      id="platforms"
      aria-labelledby="platforms-heading"
      className="aply-panel px-0 py-0"
    >
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          id="platforms-heading"
          eyebrow={t("platforms.eyebrow")}
          title={t("platforms.title")}
          subtitle={`${total} ${t("platforms.subtitleSuffix")}`}
        />

        {/* Filter bar — search full width, filters on the row below */}
        <div className="mt-6 space-y-2 rounded-xl bg-card p-3 ring-1 ring-border/40">
          <div className="relative w-full">
            <Icon
              name="search"
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={t("platforms.search")}
              className="touch-target w-full pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="touch-target w-[min(100%,11rem)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_VALUES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`platforms.category.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={loginFilter}
              onValueChange={(v) => {
                setLoginFilter(v as "all" | "login" | "no_login");
                setPage(1);
              }}
            >
              <SelectTrigger className="touch-target w-[min(100%,11rem)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("platforms.filter.loginAll")}</SelectItem>
                <SelectItem value="login">{t("platforms.filter.loginYes")}</SelectItem>
                <SelectItem value="no_login">{t("platforms.filter.loginNo")}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={connectionFilter}
              onValueChange={(v) => {
                setConnectionFilter(v as "all" | "connected" | "not_connected");
                setPage(1);
              }}
            >
              <SelectTrigger className="touch-target w-[min(100%,11rem)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("platforms.filter.connAll")}</SelectItem>
                <SelectItem value="connected">{t("platforms.filter.connYes")}</SelectItem>
                <SelectItem value="not_connected">{t("platforms.filter.connNo")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <Switch
                id="pf-enabled-only"
                checked={enabledOnly}
                onCheckedChange={(v) => {
                  setEnabledOnly(v);
                  setPage(1);
                }}
              />
              <Label htmlFor="pf-enabled-only" className="whitespace-nowrap text-sm font-normal">
                {t("platforms.enabledOnly")}
              </Label>
            </div>
            <div className="ml-auto">
              <AddPlatformDialog onCreated={load} />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            align="start"
          />
        </div>

        {/* List */}
        <div className="mt-3 max-h-[60rem] overflow-y-auto rounded-xl border border-border/60 bg-card aply-scroll">
          {loading ? (
            <div className="divide-y divide-border/60">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <Skeleton className="h-7 w-7 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-7 w-16" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-primary">
                <Icon name="search" size={20} />
              </span>
              <p className="text-sm text-muted-foreground">{t("platforms.empty")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((p) => (
                <PlatformRow
                  key={p.id}
                  platform={p}
                  sessionStatus={sessions[p.id] ?? null}
                  onToggle={handleToggle}
                  onClick={handleCardClick}
                  onConnect={handleConnect}
                  onConfirm={handleConfirm}
                  connecting={connectingId === p.id}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            align="end"
          />
        </div>
        {togglingId && (
          <p className="sr-only" aria-live="polite">
            {t("platforms.updating")}
          </p>
        )}
      </div>

      <PlatformDetailDrawer
        platformId={drawerId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </section>
  );
}
