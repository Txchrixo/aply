/**
 * Notification channel catalog — shared by onboarding + settings.
 * Add a new channel here (and optional destination field in Settings)
 * without rewriting the UI.
 */
export type NotifyChannelId = "email" | "whatsapp" | "telegram" | "discord";

/** Destination keys currently persisted on Setting */
export type NotifyDestinationKey = "notifyEmail" | "notifyWhatsapp";

export type NotifyChannelDef = {
  id: NotifyChannelId;
  /** Fallback English label (i18n may override in UI) */
  label: string;
  available: boolean;
  /** DB field to fill when this channel is enabled; omit for coming-soon */
  destinationKey?: NotifyDestinationKey;
  inputType?: "email" | "tel" | "text";
  placeholder?: string;
};

export const NOTIFY_CHANNELS: readonly NotifyChannelDef[] = [
  {
    id: "email",
    label: "Email",
    available: true,
    destinationKey: "notifyEmail",
    inputType: "email",
    placeholder: "you@example.com",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    available: true,
    destinationKey: "notifyWhatsapp",
    inputType: "tel",
    placeholder: "+33 6 12 34 56 78",
  },
  {
    id: "telegram",
    label: "Telegram",
    available: false,
  },
  {
    id: "discord",
    label: "Discord",
    available: false,
  },
] as const;

export const AVAILABLE_NOTIFY_CHANNELS = NOTIFY_CHANNELS.filter((c) => c.available);

/** Legacy Setting.notifyChannel values derived from multi-select */
export type NotifyChannelMode = "dashboard" | "email" | "whatsapp" | "both";

export function deriveNotifyChannel(
  selected: Iterable<NotifyChannelId>
): NotifyChannelMode {
  const set = selected instanceof Set ? selected : new Set(selected);
  const email = set.has("email");
  const whatsapp = set.has("whatsapp");
  if (email && whatsapp) return "both";
  if (email) return "email";
  if (whatsapp) return "whatsapp";
  return "dashboard";
}

export function selectionFromNotifySettings(s: {
  notifyEmail?: string | null;
  notifyWhatsapp?: string | null;
  notifyChannel?: string | null;
}): Set<NotifyChannelId> {
  const next = new Set<NotifyChannelId>();
  const channel = s.notifyChannel ?? "dashboard";
  if (s.notifyEmail?.trim() || channel === "email" || channel === "both") {
    next.add("email");
  }
  if (s.notifyWhatsapp?.trim() || channel === "whatsapp" || channel === "both") {
    next.add("whatsapp");
  }
  return next;
}

export function getNotifyChannel(id: NotifyChannelId): NotifyChannelDef | undefined {
  return NOTIFY_CHANNELS.find((c) => c.id === id);
}
