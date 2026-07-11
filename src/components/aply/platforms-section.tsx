"use client";
/**
 * PlatformsSection · filterable, paginated grid of monitored platforms.
 * Includes an "Add platform" dialog that POSTs to /api/platforms.
 */
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { hasRssFeed } from "@/lib/rss-feeds";
import {
  CategoryBadge,
  ContractBadge,
  LangBadge,
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
  onToggle: (id: string, next: boolean) => void;
  onClick: (id: string) => void;
}

function PlatformCard({ platform, onToggle, onClick }: PlatformCardProps) {
  const { t } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
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
      className="aply-card-hover flex cursor-pointer flex-col gap-3 rounded-lg border border-[#CFC5BE] bg-[#FFF4DC] p-4 dark:bg-[#3A2417]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <PriorityDot priority={platform.priority} />
          <span className="truncate font-medium text-[#4A2F1A] dark:text-[#FFE4B5]">
            {platform.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={t("platforms.aria.openInNewTab").replace("{name}", platform.name)}
            className="rounded-md p-1.5 text-[#79695E] transition-colors hover:bg-[#FFE4B5] hover:text-[#C65D00] dark:hover:bg-[#4A2F1A]"
          >
            <Icon name="link-external" size={14} />
          </a>
          <Switch
            checked={platform.enabled}
            onCheckedChange={(v) => onToggle(platform.id, v)}
            onClick={(e) => e.stopPropagation()}
            aria-label={t("platforms.aria.toggle").replace("{name}", platform.name)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryBadge category={platform.category} />
        {platform.hasLoginRequired && (
          <span className="inline-flex items-center gap-1 rounded border border-[#CFC5BE] bg-[#FFE4B5] px-1.5 py-0.5 text-[10px] font-medium text-[#79695E] dark:border-[#5A3D26] dark:bg-[#4A2F1A]">
            <Icon name="shield-lock" size={10} />
            {t("platforms.login")}
          </span>
        )}
        {platform.hasAntiBot && (
          <span className="inline-flex items-center gap-1 rounded border border-[#B23A1E]/30 bg-[#B23A1E]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#B23A1E]">
            <Icon name="alert" size={10} />
            {t("platforms.antibot")}
          </span>
        )}
        {hasRssFeed(platform.name) && (
          <span
            className="inline-flex items-center gap-1 rounded border border-[#FF9F1C]/40 bg-[#FF9F1C]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#C65D00] dark:border-[#FF9F1C]/50 dark:text-[#FF9F1C]"
            title={t("platforms.rssTooltip")}
          >
            <Icon name="rss" size={10} />
            RSS
          </span>
        )}
      </div>

      <a
        href={platform.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block truncate text-xs text-[#79695E] hover:text-[#C65D00]"
        title={platform.url}
      >
        {platform.url.replace(/^https?:\/\//, "")}
      </a>

      <div className="flex flex-wrap items-center gap-1">
        {platform.languages.map((l) => (
          <LangBadge key={l} lang={l} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {platform.contractTypes.map((c) => (
          <ContractBadge key={c} type={c} />
        ))}
      </div>

      {platform.notes && (
        <p
          className="line-clamp-1 text-[11px] text-[#79695E]"
          title={platform.notes}
        >
          {platform.notes}
        </p>
      )}
    </motion.div>
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
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleCardClick = (id: string) => {
    setDrawerId(id);
    setDrawerOpen(true);
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
  }, [page, category, q, enabledOnly]);

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
      className="px-4 py-12 md:px-6 md:py-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          id="platforms-heading"
          eyebrow={t("platforms.eyebrow")}
          title={t("platforms.title")}
          subtitle={`${total} ${t("platforms.subtitleSuffix")}`}
        />

        {/* Filter bar */}
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#CFC5BE] bg-[#FFF4DC] p-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Icon
              name="search"
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#79695E]"
            />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={t("platforms.search")}
              className="pl-9 bg-[#FFE4B5]"
            />
          </div>
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full bg-[#FFE4B5] md:w-48">
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
          <div className="flex items-center gap-2 rounded-md border border-[#CFC5BE] bg-[#FFE4B5] px-3 py-2">
            <Switch
              id="pf-enabled-only"
              checked={enabledOnly}
              onCheckedChange={(v) => {
                setEnabledOnly(v);
                setPage(1);
              }}
            />
            <Label htmlFor="pf-enabled-only" className="text-sm font-normal whitespace-nowrap">
              {t("platforms.enabledOnly")}
            </Label>
          </div>
          <AddPlatformDialog onCreated={load} />
        </div>

        {/* Grid */}
        <ScrollArea className="mt-6 h-[60rem] pr-1">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-44 rounded-lg border border-[#CFC5BE] bg-[#FFF4DC]"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#CFC5BE] bg-[#FFF4DC] px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFE4B5] text-[#C65D00]">
                <Icon name="search" size={20} />
              </span>
              <p className="text-sm text-[#79695E]">
                {t("platforms.empty")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((p) => (
                <PlatformCard
                  key={p.id}
                  platform={p}
                  onToggle={handleToggle}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-[#79695E]">
            {t("platforms.page")} {page} {t("platforms.of")} {Math.max(1, totalPages)} · {total} {t("platforms.total")}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border-[#CFC5BE] text-[#4A2F1A] hover:bg-[#FFE4B5]"
            >
              <Icon name="arrow-left" size={14} />
              {t("platforms.prev")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="border-[#CFC5BE] text-[#4A2F1A] hover:bg-[#FFE4B5]"
            >
              {t("platforms.next")}
              <Icon name="arrow-right" size={14} />
            </Button>
          </div>
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
