"use client";
/**
 * SettingsSection · full settings form bound to /api/settings.
 */
import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
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
import type { Settings } from "@/components/aply/types";
import { apiFetch } from "@/components/aply/utils";
import { useI18n } from "@/components/aply/i18n";

interface SettingsSectionProps {
  settings: Settings | null;
  loading: boolean;
  onSettingsChange: (s: Partial<Settings>) => Promise<Settings>;
}

const LANGS = ["en", "fr", "de"] as const;
const INTERVAL_VALUES = [5, 10, 15, 30, 60] as const;
const CHANNEL_VALUES = ["dashboard", "email", "whatsapp", "both"] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Tag-style input for managing a list of email addresses.
 * - Type an email and press Enter or comma to add it.
 * - Backspace on an empty input removes the last tag.
 * - Comma-separated paste (e.g. "a@x.com, b@y.com") splits into multiple tags.
 * - Invalid emails are rejected with a small inline hint.
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
    // Accept both comma- and whitespace-separated lists.
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
    if (settings) setForm(settings);
  }, [settings]);

  const update = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

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
      await onSettingsChange(form);
      toast.success(t("settings.saved"));
    } catch (e) {
      toast.error(t("settings.toast.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setTestingNotif(true);
    setTestPreview(null);
    try {
      const channel =
        form.notifyChannel === "whatsapp" ? "whatsapp" : "email";
      const to =
        channel === "email"
          ? form.notifyEmail ?? "you@example.com"
          : form.notifyWhatsapp ?? "+33 6 12 34 56 78";
      // Build a preview locally (no backend call needed)
      const preview = {
        channel,
        to,
        subject: "Aply · test notification",
        body: [
          `Hi Alex,`,
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
      };
      setTestPreview(preview);
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
      className="px-4 py-12 md:px-6 md:py-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          id="settings-heading"
          eyebrow={t("settings.eyebrow")}
          title={t("settings.title")}
          subtitle={t("settings.subtitle")}
        />

        <Card className="mt-8 gap-6 rounded-xl border-border bg-card p-6">
          {loading || !settings ? (
            <div className="grid gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Monitoring enabled */}
              <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-4">
                <div className="flex-1">
                  <Label htmlFor="set-mon" className="font-medium text-foreground">
                    {t("settings.monitoring")}
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("settings.monitoring.desc")}
                  </p>
                </div>
                <Switch
                  id="set-mon"
                  checked={!!form.monitoringEnabled}
                  onCheckedChange={(v) => update("monitoringEnabled", v)}
                />
              </div>

              {/* Scan interval */}
              <div className="rounded-lg border border-border bg-background p-4">
                <Label className="font-medium text-foreground">
                  {t("settings.interval")}
                </Label>
                <p className="mb-3 mt-1 text-xs text-muted-foreground">
                  {t("settings.interval.desc")}
                </p>
                <Select
                  value={String(form.scanIntervalMinutes ?? 15)}
                  onValueChange={(v) =>
                    update("scanIntervalMinutes", Number(v))
                  }
                >
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVAL_VALUES.map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {t("settings.interval.every")} {m} {t("settings.interval.min")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Anti-AI strict mode */}
              <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-4">
                <div className="flex-1">
                  <Label
                    htmlFor="set-strict"
                    className="font-medium text-foreground"
                  >
                    {t("settings.strict")}
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("settings.strict.desc")}
                  </p>
                </div>
                <Switch
                  id="set-strict"
                  checked={!!form.antiAiStrictMode}
                  onCheckedChange={(v) => update("antiAiStrictMode", v)}
                />
              </div>

              {/* Auto-approve threshold */}
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-foreground">
                    {t("settings.threshold")}
                  </Label>
                  <span className="font-heading text-lg font-semibold text-primary">
                    {Math.round((form.autoApproveThreshold ?? 0) * 100)}%
                  </span>
                </div>
                <p className="mb-3 mt-1 text-xs text-muted-foreground">
                  {t("settings.threshold.desc")}
                </p>
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
              </div>

              {/* Languages */}
              <div className="rounded-lg border border-border bg-background p-4">
                <Label className="font-medium text-foreground">{t("settings.languages")}</Label>
                <p className="mb-3 mt-1 text-xs text-muted-foreground">
                  {t("settings.languages.desc")}
                </p>
                <div className="flex flex-wrap gap-4">
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
              </div>

              {/* Notification channel */}
              <div className="rounded-lg border border-border bg-background p-4">
                <Label className="font-medium text-foreground">
                  {t("settings.channel")}
                </Label>
                <p className="mb-3 mt-1 text-xs text-muted-foreground">
                  {t("settings.channel.desc")}
                </p>
                <Select
                  value={form.notifyChannel ?? "dashboard"}
                  onValueChange={(v) => update("notifyChannel", v)}
                >
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNEL_VALUES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(`settings.channel.${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notify email */}
              <div className="grid gap-1.5">
                <Label htmlFor="set-email" className="font-medium text-foreground">
                  {t("settings.email")}
                </Label>
                <Input
                  id="set-email"
                  type="email"
                  value={form.notifyEmail ?? ""}
                  onChange={(e) => update("notifyEmail", e.target.value)}
                  placeholder={t("settings.placeholder.email")}
                  className="bg-background"
                />
              </div>

              {/* Notify WhatsApp */}
              <div className="grid gap-1.5">
                <Label htmlFor="set-wa" className="font-medium text-foreground">
                  {t("settings.whatsapp")}
                </Label>
                <Input
                  id="set-wa"
                  type="tel"
                  value={form.notifyWhatsapp ?? ""}
                  onChange={(e) => update("notifyWhatsapp", e.target.value)}
                  placeholder={t("settings.placeholder.whatsapp")}
                  className="bg-background"
                />
              </div>

              {/* Test notification preview */}
              <div className="md:col-span-2">
                <Button
                  variant="outline"
                  onClick={handleTestNotification}
                  disabled={testingNotif}
                  className="border-[#C65D00] text-primary hover:bg-background"
                >
                  {testingNotif ? (
                    <Icon name="sync" size={14} className="animate-spin" />
                  ) : (
                    <Icon name="bell" size={14} />
                  )}
                  {t("settings.testNotification")}
                </Button>
                {testPreview && (
                  <div className="mt-3 rounded-lg border border-border bg-background p-4 dark:border-[#5A3D26] dark:bg-[#4A2F1A]">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                        <Icon name={testPreview.channel === "email" ? "mail" : "comment-discussion"} size={12} />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {testPreview.channel === "email" ? "Email preview" : "WhatsApp preview"}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
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
              </div>

              {/* Weekly digest preview */}
              <div className="md:col-span-2">
                <Button
                  variant="outline"
                  onClick={handleLoadDigest}
                  disabled={loadingDigest}
                  className="border-[#8B4513] text-[#8B4513] hover:bg-background dark:border-[#D2691E] dark:text-[#D2691E]"
                >
                  {loadingDigest ? (
                    <Icon name="sync" size={14} className="animate-spin" />
                  ) : (
                    <Icon name="mail" size={14} />
                  )}
                  {t("settings.weeklyDigest")}
                </Button>
                {digest && (
                  <div className="mt-3 rounded-lg border border-border bg-background p-4 dark:border-[#5A3D26] dark:bg-[#4A2F1A]">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-[#8B4513] text-primary-foreground">
                        <Icon name="mail" size={12} />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D2691E]">
                        {t("settings.digestPreview")}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground dark:text-[#C9B89F]">
                        {t("settings.last7Days")}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground dark:text-primary-foreground">
                      {digest.subject}
                    </p>
                    <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md bg-card p-3 text-xs leading-relaxed text-muted-foreground dark:bg-[#3A2417] dark:text-[#C9B89F]">
                      {digest.body}
                    </pre>
                  </div>
                )}
              </div>

              {/* Account emails (tag-style input) */}
              <div className="md:col-span-2 rounded-lg border border-border bg-background p-4 dark:border-[#5A3D26] dark:bg-[#4A2F1A]">
                <Label className="font-medium text-foreground dark:text-primary-foreground">
                  {t("settings.accountEmails")}
                </Label>
                <p className="mb-3 mt-1 text-xs text-muted-foreground dark:text-[#C9B89F]">
                  {t("settings.accountEmails.desc")}
                </p>
                <AccountEmailsInput
                  emails={form.accountEmails ?? []}
                  onChange={(arr) => update("accountEmails", arr)}
                  placeholder={t("settings.placeholder.emails")}
                />
              </div>

              {/* Prefer career page */}
              <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-4 md:col-span-2 dark:border-[#5A3D26] dark:bg-[#4A2F1A]">
                <div className="flex-1">
                  <Label
                    htmlFor="set-prefer-career"
                    className="font-medium text-foreground dark:text-primary-foreground"
                  >
                    {t("settings.preferCareerPage")}
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground dark:text-[#C9B89F]">
                    {t("settings.preferCareerPage.desc")}
                  </p>
                </div>
                <Switch
                  id="set-prefer-career"
                  checked={!!form.preferCareerPage}
                  onCheckedChange={(v) => update("preferCareerPage", v)}
                />
              </div>

              <div className="md:col-span-2 flex justify-end border-t border-border pt-4 dark:border-[#5A3D26]">
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
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
