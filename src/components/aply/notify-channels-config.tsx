"use client";
/**
 * Multi-select notification channels + destination fields.
 * Matches onboarding UX; ready for future channels (telegram, discord, …).
 */
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/aply/icon";
import { NotifyChannelIcon } from "@/components/aply/brand-icons";
import {
  NOTIFY_CHANNELS,
  type NotifyChannelDef,
  type NotifyChannelId,
  type NotifyDestinationKey,
} from "@/lib/notify-channels";
import { cn } from "@/lib/utils";

export type NotifyDestinations = Partial<Record<NotifyDestinationKey, string>>;

type Props = {
  selected: Set<NotifyChannelId>;
  destinations: NotifyDestinations;
  onToggle: (id: NotifyChannelId) => void;
  onDestinationChange: (key: NotifyDestinationKey, value: string) => void;
  /** Optional i18n label resolver; falls back to catalog label */
  labelFor?: (ch: NotifyChannelDef) => string;
  /** Optional i18n for destination field labels */
  destinationLabelFor?: (ch: NotifyChannelDef) => string;
  soonLabel?: string;
  className?: string;
};

export function NotifyChannelsConfig({
  selected,
  destinations,
  onToggle,
  onDestinationChange,
  labelFor,
  destinationLabelFor,
  soonLabel = "Soon",
  className,
}: Props) {
  const handleToggle = (ch: NotifyChannelDef) => {
    if (!ch.available) {
      toast.message("Coming soon", {
        description: `${ch.label} alerts aren’t ready yet.`,
      });
      return;
    }
    onToggle(ch.id);
  };

  const activeWithDestination = NOTIFY_CHANNELS.filter(
    (ch) => ch.available && ch.destinationKey && selected.has(ch.id)
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-2">
        {NOTIFY_CHANNELS.map((ch) => {
          const active = selected.has(ch.id);
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => handleToggle(ch)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                !ch.available && "cursor-not-allowed opacity-50",
                ch.available && active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <NotifyChannelIcon id={ch.id} size={14} />
              {labelFor?.(ch) ?? ch.label}
              {!ch.available && (
                <span className="text-[10px] uppercase tracking-wide">
                  {soonLabel}
                </span>
              )}
              {ch.available && active && (
                <Icon name="check-circle-fill" size={14} className="text-primary" />
              )}
            </button>
          );
        })}
      </div>

      {activeWithDestination.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {activeWithDestination.map((ch) => {
            const key = ch.destinationKey!;
            return (
              <div key={ch.id} className="space-y-1.5">
                <Label htmlFor={`notify-dest-${ch.id}`} className="text-sm font-medium">
                  {destinationLabelFor?.(ch) ?? ch.label}
                </Label>
                <Input
                  id={`notify-dest-${ch.id}`}
                  type={ch.inputType ?? "text"}
                  value={destinations[key] ?? ""}
                  onChange={(e) => onDestinationChange(key, e.target.value)}
                  placeholder={ch.placeholder}
                  className="bg-card"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
