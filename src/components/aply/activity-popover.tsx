"use client";
/**
 * ActivityPopover · bell icon in the header that opens a popover showing
 * recent activity (new offers, approvals, submissions) from NotificationLog.
 * Includes an unread count badge and "mark all read" action.
 */
import { useEffect, useState, useCallback } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icon } from "@/components/aply/icon";
import { useI18n } from "@/components/aply/i18n";
import { apiFetch, relativeTime } from "@/components/aply/utils";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  channel: string;
  direction: string;
  status: string;
  createdAt: string;
  payload: {
    type?: string;
    title?: string;
    company?: string;
    platform?: string;
    reason?: string;
  } | null;
}

interface ActivityResponse {
  items: ActivityItem[];
}

const ICON_MAP: Record<string, string> = {
  new_offer: "pulse",
  approved: "check",
  rejected: "x",
  sent: "mail",
};

const COLOR_MAP: Record<string, string> = {
  new_offer: "bg-[#FF9F1C]/15 text-[#C65D00]",
  approved: "bg-[#2ea043]/12 text-[#2ea043]",
  rejected: "bg-[#B23A1E]/12 text-[#B23A1E]",
  sent: "bg-[#C65D00]/12 text-[#C65D00]",
};

export function ActivityPopover() {
  const { t } = useI18n();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<ActivityResponse>("/api/notifications?limit=15");
      setItems(res.items ?? []);
      // Count items from the last visit as "unread"
      const lastSeen = (() => {
        try {
          return Number(localStorage.getItem("aply-activity-seen") ?? 0);
        } catch {
          return 0;
        }
      })();
      const newCount = (res.items ?? []).filter(
        (i) => new Date(i.createdAt).getTime() > lastSeen
      ).length;
      setUnread(newCount);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    load();
    // Poll every 30s for fresh activity
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      try {
        localStorage.setItem("aply-activity-seen", String(Date.now()));
      } catch {
        /* ignore */
      }
      setUnread(0);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          aria-label={t("header.activity")}
          className="relative flex h-9 w-9 items-center justify-center rounded-md border border-[#CFC5BE] bg-[#FFE4B5] text-[#4A2F1A] transition-colors hover:border-[#C65D00] hover:text-[#C65D00]"
        >
          <Icon name="bell" size={16} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C65D00] px-1 text-[10px] font-bold text-[#FFE4B5]">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 rounded-xl border-[#CFC5BE] bg-[#FFF4DC] p-0"
      >
        <div className="flex items-center justify-between border-b border-[#CFC5BE] px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon name="bell" size={14} className="text-[#C65D00]" />
            <span className="font-heading text-sm font-semibold text-[#4A2F1A]">
              {t("header.activity")}
            </span>
          </div>
          <button
            onClick={load}
            aria-label="Refresh"
            className="text-[#79695E] transition-colors hover:text-[#C65D00]"
          >
            <Icon name="sync" size={13} />
          </button>
        </div>
        <ScrollArea className="h-80">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFE4B5] text-[#C65D00]">
                <Icon name="check" size={18} />
              </span>
              <p className="text-sm text-[#79695E]">No activity yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#CFC5BE]">
              {items.map((item) => {
                const type = item.payload?.type ?? item.status;
                const iconName = ICON_MAP[type] ?? "dot";
                const colorClass = COLOR_MAP[type] ?? "bg-[#FFE4B5] text-[#79695E]";
                const title =
                  item.payload?.title ?? "Activity";
                const company =
                  item.payload?.company ?? null;
                return (
                  <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                        colorClass
                      )}
                    >
                      <Icon name={iconName} size={13} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#4A2F1A]">
                        {title}
                      </p>
                      <p className="truncate text-xs text-[#79695E]">
                        {company ? `${company} · ` : ""}
                        {item.payload?.platform ?? ""}
                        {item.payload?.platform ? " · " : ""}
                        {relativeTime(item.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
