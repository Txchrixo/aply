"use client";
/**
 * SettingsSection · full settings form bound to /api/settings.
 * Layout: grouped sections with uniform setting rows (no jagged 2-col cards).
 */
import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/components/aply/icon";
import { SectionHeading } from "@/components/aply/section-heading";
import { NotifyChannelsConfig } from "@/components/aply/notify-channels-config";
import type { Settings } from "@/components/aply/types";
import { apiFetch } from "@/components/aply/utils";
import { useI18n } from "@/components/aply/i18n";
import { cn } from "@/lib/utils";
import {
  deriveNotifyChannel,
  selectionFromNotifySettings,
  type NotifyChannelId,
  type NotifyDestinationKey,
} from "@/lib/notify-channels";
import { greetingLine, greetingName, splitFullName } from "@/lib/user-identity";

interface SettingsSectionProps {
  settings: Settings | null;
  loading: boolean;
  onSettingsChange: (s: Partial<Settings>) => Promise<Settings>;
}

const LANGS = ["en", "fr", "de"] as const;
const INTERVAL_VALUES = [5, 10, 15, 30, 60] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
        {title}
      </h3>
      <div className="overflow-hidden rounded-lg border border-border bg-background divide-y divide-border">
        {children}
      </div>
    </section>
  );
}

function SettingRow({
  label,
  description,
  htmlFor,
  control,
  children,
  className,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  control?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <Label
          htmlFor={htmlFor}
          className="font-medium text-foreground dark:text-primary-foreground"
        >
          {label}
        </Label>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground dark:text-[#C9B89F]">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-3">{children}</div> : null}
      </div>
      {control ? (
        <div className="flex shrink-0 items-center sm:justify-end">{control}</div>
      ) : null}
    </div>
  );
}

/**
 * Tag-style input for managing a list of email addresses.
 */
function AccountEmailsInput({
  emails,
  onChange,
  placeholder,
}: {
  emails: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addMany = (raw: string) => {
    const candidates = raw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (candidates.length === 0) return;
    const valid: string[] = [];
    let firstInvalid: string | null = null;
    for (const c of candidates) {
      if (!EMAIL_REGEX.test(c)) {
        if (firstInvalid === null) firstInvalid = c;
        continue;
      }
      if (!emails.includes(c) && !valid.includes(c)) valid.push(c);
    }
    if (valid.length > 0) {
      onChange([...emails, ...valid]);
      setError(null);
    } else if (firstInvalid) {
      setError(`"${firstInvalid}" is not a valid email`);
    }
    setInput("");
  };

  const removeEmail = (e: string) => {
    onChange(emails.filter((x) => x !== e));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addMany(input);
    } else if (e.key === "Backspace" && input === "" && emails.length > 0) {
      removeEmail(emails[emails.length - 1]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-card p-2 focus-within:border-[#C65D00] dark:border-[#5A3D26] dark:bg-[#3A2417] dark:focus-within:border-[#FF9F1C]">
        {emails.map((e) => (
          <span
            key={e}
            className="inline-flex items-center gap-1 rounded border border-[#C65D00]/30 bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary dark:border-[#FF9F1C]/40 dark:bg-accent/15 dark:text-[#FF9F1C]"
          >
            <Icon name="mail" size={10} />
            {e}
            <button
              type="button"
              onClick={() => removeEmail(e)}
              className="ml-0.5 text-muted-foreground hover:text-[#B23A1E] dark:text-[#C9B89F] dark:hover:text-[#FF9F1C]"
              aria-label={`Remove ${e}`}
            >
              <Icon name="x" size={10} />
            </button>
          </span>
        ))}
        <input
          type="email"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (input.trim()) addMany(input);
          }}
          placeholder={emails.length === 0 ? placeholder : ""}
          className="min-w-[10rem] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground dark:text-primary-foreground dark:placeholder:text-[#C9B89F]"
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-[#B23A1E] dark:text-[#FF6B4A]">{error}</p>
      )}
      {emails.length > 0 && (
        <p className="mt-1 text-[10px] text-muted-foreground dark:text-[#C9B89F]">
          {emails.length} email{emails.length > 1 ? "s" : ""} · press Enter or comma to add
        </p>
      )}
    </div>
  );
}

export function SettingsSection({
  settings,
  loading,
  onSettingsChange,
}: SettingsSectionProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<Partial<Settings>>({});
  const [selectedNotify, setSelectedNotify] = useState<Set<NotifyChannelId>>(
    () => new Set()
  );
  const [saving, setSaving] = useState(false);
  const [testingNotif, setTestingNotif] = useState(false);
  const [testPreview, setTestPreview] = useState<{
    channel: string;
    to: string;
    subject: string;
    body: string;
  } | null>(null);
  const [loadingDigest, setLoadingDigest] = useState(false);
  const [digest, setDigest] = useState<{
    subject: string;
    body: string;
    stats: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    if (!settings) return;
    let firstName = settings.firstName ?? "";
    let lastName = settings.lastName ?? "";

    // One-time hydrate from signup localStorage if DB has no profile yet
    if (!firstName.trim()) {
      try {
        const storedFirst = localStorage.getItem("aply_first_name");
        const storedLast = localStorage.getItem("aply_last_name");
        const storedFull = localStorage.getItem("aply_name");
        if (storedFirst?.trim()) {
          firstName = storedFirst.trim();
          lastName = storedLast?.trim() ?? "";
        } else if (storedFull?.trim()) {
          const split = splitFullName(storedFull);
          firstName = split.firstName;
          lastName = split.lastName;
        }
        if (firstName) {
          void apiFetch("/api/settings", {
            method: "POST",
            body: JSON.stringify({ firstName, lastName }),
          }).catch(() => undefined);
        }
      } catch {
        /* ignore */
      }
    }

    setForm({ ...settings, firstName, lastName });
    setSelectedNotify(selectionFromNotifySettings(settings));
  }, [settings]);

  const update = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const toggleNotifyChannel = (id: NotifyChannelId) => {
    setSelectedNotify((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);

      setForm((f) => {
        const patch: Partial<Settings> = {
          notifyChannel: deriveNotifyChannel(next),
        };
        if (!next.has("email")) patch.notifyEmail = "";
        if (!next.has("whatsapp")) patch.notifyWhatsapp = "";
        return { ...f, ...patch };
      });
      return next;
    });
  };

  const setNotifyDestination = (key: NotifyDestinationKey, value: string) => {
    update(key, value);
  };

  const toggleLang = (l: string) => {
    const cur = form.languages ?? [];
    update(
      "languages",
      cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<Settings> = {
        ...form,
        notifyChannel: deriveNotifyChannel(selectedNotify),
        notifyEmail: selectedNotify.has("email")
          ? form.notifyEmail ?? ""
          : "",
        notifyWhatsapp: selectedNotify.has("whatsapp")
          ? form.notifyWhatsapp ?? ""
          : "",
      };
      await onSettingsChange(payload);
      try {
        if (payload.firstName != null) {
          localStorage.setItem("aply_first_name", String(payload.firstName));
        }
        if (payload.lastName != null) {
          localStorage.setItem("aply_last_name", String(payload.lastName));
        }
        const full = [payload.firstName, payload.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (full) localStorage.setItem("aply_name", full);
      } catch {
        /* ignore */
      }
      toast.success(t("settings.saved"));
    } catch {
      toast.error(t("settings.toast.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const resolveClientGreeting = () => {
    const fromProfile = greetingName(form.firstName);
    if (fromProfile) return fromProfile;
    try {
      const fromLs = greetingName(localStorage.getItem("aply_first_name"));
      if (fromLs) return fromLs;
      const fromFull = greetingName(localStorage.getItem("aply_name"));
      if (fromFull) return fromFull;
    } catch {
      /* ignore */
    }
    return "there";
  };

  const handleTestNotification = async () => {
    setTestingNotif(true);
    setTestPreview(null);
    try {
      const preferWhatsapp =
        selectedNotify.has("whatsapp") && !selectedNotify.has("email");
      const channel = preferWhatsapp ? "whatsapp" : "email";
      const to =
        channel === "email"
          ? form.notifyEmail || form.accountEmails?.[0] || "you@example.com"
          : form.notifyWhatsapp || "+00 000 000 000";
      const name = resolveClientGreeting();
      setTestPreview({
        channel,
        to,
        subject: "Aply · test notification",
        body: [
          greetingLine(name),
          ``,
          `This is a test notification from Aply.`,
          ``,
          `When Aply prepares a cover letter, you'll get a message like this:`,
          `• Role: Senior Frontend Engineer`,
          `• Company: Lumio`,
          `• Platform: Indeed`,
          `• Quality score: 87%`,
          ``,
          `Reply with APPROVE or REJECT to decide.`,
          ``,
          `- Aply`,
        ].join("\n"),
      });
      toast.success("Notification preview generated");
    } catch {
      toast.error("Failed to generate preview");
    } finally {
      setTestingNotif(false);
    }
  };

  const handleLoadDigest = async () => {
    setLoadingDigest(true);
    setDigest(null);
    try {
      const d = await apiFetch<{
        email: { subject: string; body: string };
        stats: Record<string, number>;
      }>("/api/digest");
      setDigest({
        subject: d.email.subject,
        body: d.email.body,
        stats: d.stats,
      });
      toast.success(t("settings.digestLoaded"));
    } catch {
      toast.error("Failed to load digest");
    } finally {
      setLoadingDigest(false);
    }
  };

  return (
    <section
      id="settings"
      aria-labelledby="settings-heading"
      className="aply-panel px-0 py-0"
    >
      <div className="mx-auto w-full max-w-3xl">
        <SectionHeading
          id="settings-heading"
          eyebrow={t("settings.eyebrow")}
          title={t("settings.title")}
          subtitle={t("settings.subtitle")}
        />

        <Card className="mt-8 gap-8 rounded-xl border-border bg-card p-5 sm:p-6">
          {loading || !settings ? (
            <div className="grid gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <>
              <SettingsGroup title={t("settings.group.profile")}>
                <div className="grid gap-3 px-4 py-3.5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="set-first-name">{t("settings.firstName")}</Label>
                    <Input
                      id="set-first-name"
                      value={form.firstName ?? ""}
                      onChange={(e) => update("firstName", e.target.value)}
                      placeholder="Christian"
                      className="bg-card"
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="set-last-name">{t("settings.lastName")}</Label>
                    <Input
                      id="set-last-name"
                      value={form.lastName ?? ""}
                      onChange={(e) => update("lastName", e.target.value)}
                      placeholder="Nana"
                      className="bg-card"
                      autoComplete="family-name"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground sm:col-span-2 dark:text-[#C9B89F]">
                    {t("settings.profile.desc")}
                  </p>
                </div>
              </SettingsGroup>

              <SettingsGroup title={t("settings.group.monitoring")}>
                <SettingRow
                  label={t("settings.monitoring")}
                  description={t("settings.monitoring.desc")}
                  htmlFor="set-mon"
                  control={
                    <Switch
                      id="set-mon"
                      checked={!!form.monitoringEnabled}
                      onCheckedChange={(v) => update("monitoringEnabled", v)}
                    />
                  }
                />
                <SettingRow
                  label={t("settings.interval")}
                  description={t("settings.interval.desc")}
                  control={
                    <Select
                      value={String(form.scanIntervalMinutes ?? 15)}
                      onValueChange={(v) =>
                        update("scanIntervalMinutes", Number(v))
                      }
                    >
                      <SelectTrigger className="w-[11.5rem] bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERVAL_VALUES.map((m) => (
                          <SelectItem key={m} value={String(m)}>
                            {t("settings.interval.every")} {m}{" "}
                            {t("settings.interval.min")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  }
                />
              </SettingsGroup>

              <SettingsGroup title={t("settings.group.quality")}>
                <SettingRow
                  label={t("settings.strict")}
                  description={t("settings.strict.desc")}
                  htmlFor="set-strict"
                  control={
                    <Switch
                      id="set-strict"
                      checked={!!form.antiAiStrictMode}
                      onCheckedChange={(v) => update("antiAiStrictMode", v)}
                    />
                  }
                />
                <SettingRow
                  label={t("settings.threshold")}
                  description={t("settings.threshold.desc")}
                  control={
                    <span className="font-heading text-base font-semibold tabular-nums text-primary">
                      {Math.round((form.autoApproveThreshold ?? 0) * 100)}%
                    </span>
                  }
                >
                  <Slider
                    value={[
                      Math.round((form.autoApproveThreshold ?? 0) * 100),
                    ]}
                    onValueChange={(v) =>
                      update("autoApproveThreshold", (v[0] ?? 0) / 100)
                    }
                    min={0}
                    max={100}
                    step={5}
                  />
                </SettingRow>
                <SettingRow
                  label={t("settings.languages")}
                  description={t("settings.languages.desc")}
                >
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {LANGS.map((l) => (
                      <div key={l} className="flex items-center gap-2">
                        <Checkbox
                          id={`set-lang-${l}`}
                          checked={(form.languages ?? []).includes(l)}
                          onCheckedChange={() => toggleLang(l)}
                        />
                        <Label
                          htmlFor={`set-lang-${l}`}
                          className="text-sm font-normal"
                        >
                          {t(`settings.lang.${l}`)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </SettingRow>
              </SettingsGroup>

              <SettingsGroup title={t("settings.group.notifications")}>
                <div className="space-y-3 px-4 py-3.5">
                  <div>
                    <p className="font-medium text-foreground dark:text-primary-foreground">
                      {t("settings.channel")}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground dark:text-[#C9B89F]">
                      {t("settings.channel.desc")}
                    </p>
                  </div>
                  <NotifyChannelsConfig
                    selected={selectedNotify}
                    destinations={{
                      notifyEmail: form.notifyEmail ?? "",
                      notifyWhatsapp: form.notifyWhatsapp ?? "",
                    }}
                    onToggle={toggleNotifyChannel}
                    onDestinationChange={setNotifyDestination}
                    labelFor={(ch) => t(`settings.channel.${ch.id}`)}
                    destinationLabelFor={(ch) =>
                      ch.id === "email"
                        ? t("settings.email")
                        : ch.id === "whatsapp"
                          ? t("settings.whatsapp")
                          : t(`settings.channel.${ch.id}`)
                    }
                    soonLabel={t("settings.channel.soon")}
                  />
                </div>
                <div className="flex flex-wrap gap-2 px-4 py-3.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestNotification}
                    disabled={testingNotif || selectedNotify.size === 0}
                    className="border-[#C65D00] text-primary hover:bg-card"
                  >
                    {testingNotif ? (
                      <Icon name="sync" size={14} className="animate-spin" />
                    ) : (
                      <Icon name="bell" size={14} />
                    )}
                    {t("settings.testNotification")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadDigest}
                    disabled={loadingDigest}
                    className="border-[#8B4513] text-[#8B4513] hover:bg-card dark:border-[#D2691E] dark:text-[#D2691E]"
                  >
                    {loadingDigest ? (
                      <Icon name="sync" size={14} className="animate-spin" />
                    ) : (
                      <Icon name="mail" size={14} />
                    )}
                    {t("settings.weeklyDigest")}
                  </Button>
                </div>
                {testPreview && (
                  <div className="border-t border-border bg-card/50 px-4 py-3.5 dark:bg-[#3A2417]/40">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                        <Icon
                          name={
                            testPreview.channel === "email"
                              ? "mail"
                              : "comment-discussion"
                          }
                          size={12}
                        />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {testPreview.channel === "email"
                          ? "Email preview"
                          : "WhatsApp preview"}
                      </span>
                      <span className="text-xs text-muted-foreground sm:ml-auto">
                        To: {testPreview.to}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground dark:text-primary-foreground">
                      {testPreview.subject}
                    </p>
                    <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground dark:text-[#C9B89F]">
                      {testPreview.body}
                    </pre>
                  </div>
                )}
                {digest && (
                  <div className="border-t border-border bg-card/50 px-4 py-3.5 dark:bg-[#3A2417]/40">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-[#8B4513] text-primary-foreground">
                        <Icon name="mail" size={12} />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D2691E]">
                        {t("settings.digestPreview")}
                      </span>
                      <span className="text-xs text-muted-foreground sm:ml-auto dark:text-[#C9B89F]">
                        {t("settings.last7Days")}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground dark:text-primary-foreground">
                      {digest.subject}
                    </p>
                    <pre className="aply-scroll mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md bg-background p-3 text-xs leading-relaxed text-muted-foreground dark:bg-[#24160E] dark:text-[#C9B89F]">
                      {digest.body}
                    </pre>
                  </div>
                )}
              </SettingsGroup>

              <SettingsGroup title={t("settings.group.applications")}>
                <SettingRow
                  label={t("settings.accountEmails")}
                  description={t("settings.accountEmails.desc")}
                >
                  <AccountEmailsInput
                    emails={form.accountEmails ?? []}
                    onChange={(arr) => update("accountEmails", arr)}
                    placeholder={t("settings.placeholder.emails")}
                  />
                </SettingRow>
                <SettingRow
                  label={t("settings.preferCareerPage")}
                  description={t("settings.preferCareerPage.desc")}
                  htmlFor="set-prefer-career"
                  control={
                    <Switch
                      id="set-prefer-career"
                      checked={!!form.preferCareerPage}
                      onCheckedChange={(v) => update("preferCareerPage", v)}
                    />
                  }
                />
              </SettingsGroup>

              <div className="flex justify-end border-t border-border pt-5">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary text-primary-foreground hover:bg-accent hover:text-foreground"
                >
                  {saving ? (
                    <Icon name="sync" size={14} className="animate-spin" />
                  ) : (
                    <Icon name="check" size={14} />
                  )}
                  {t("settings.save")}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </section>
  );
}
