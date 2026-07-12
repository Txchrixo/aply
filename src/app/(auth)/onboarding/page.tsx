"use client";
/**
 * Onboarding — free navigation between steps; finish validates everything
 * and sends the user back to incomplete sections with field hints.
 * Demo resume is placeholder-only, never prefilled as value.
 */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Icon } from "@/components/aply/icon";
import { NotifyChannelsConfig } from "@/components/aply/notify-channels-config";
import { OnboardingPlatformsList } from "@/components/aply/onboarding-platforms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadResumeFile, ACCEPTED_FILE_TYPES } from "@/lib/file-extract";
import {
  RESUME_PLACEHOLDER,
  isSeedResume,
  isValidEmail,
  sanitizeOnboardingEmails,
} from "@/lib/onboarding";
import {
  type NotifyChannelId,
  type NotifyDestinationKey,
} from "@/lib/notify-channels";
import { cn } from "@/lib/utils";

const STEPS = ["Resume", "Emails", "Notifications", "Platforms", "Done"] as const;

type OnboardingState = {
  completed: boolean;
  step: number;
  resumeText: string;
  resumeFileName?: string | null;
  hasResumeFile?: boolean;
  accountEmails: string[];
  notifyEmail: string;
  notifyWhatsapp: string;
};

type FieldGap = { step: number; fields: string[] };

async function saveProgress(body: Record<string, unknown>) {
  const res = await fetch("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to save progress");
  return data as OnboardingState & { ok: boolean };
}

function hasOwnResume(text: string) {
  return Boolean(text.trim()) && !isSeedResume(text);
}

export default function OnboardingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [emails, setEmails] = useState<string[]>([""]);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyWhatsapp, setNotifyWhatsapp] = useState("");
  const [selectedNotify, setSelectedNotify] = useState<Set<NotifyChannelId>>(
    () => new Set()
  );
  const [uploading, setUploading] = useState(false);
  /** User confirmed the extracted text looks correct */
  const [resumeConfirmed, setResumeConfirmed] = useState(false);
  /** Fields still missing on the current step (set when finish redirects back) */
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onboarding");
        const data = (await res.json()) as OnboardingState;
        if (cancelled) return;
        if (data.completed) {
          router.replace("/dashboard");
          return;
        }
        const loadedStep = Math.max(0, Math.min(4, data.step ?? 0));
        setStep(loadedStep);
        const text = isSeedResume(data.resumeText) ? "" : data.resumeText || "";
        setResumeText(text);
        const hasFile = Boolean(data.hasResumeFile && data.resumeFileName);
        setResumeFileName(hasFile ? data.resumeFileName || null : null);
        // If they already moved past resume step with a file, treat extraction as reviewed
        setResumeConfirmed(hasFile && hasOwnResume(text) && loadedStep > 0);
        const cleanEmails = sanitizeOnboardingEmails(data.accountEmails ?? []);
        setEmails(cleanEmails.length ? cleanEmails : [""]);
        setNotifyEmail(data.notifyEmail || "");
        setNotifyWhatsapp(data.notifyWhatsapp || "");
        const selected = new Set<NotifyChannelId>();
        if (data.notifyEmail) selected.add("email");
        if (data.notifyWhatsapp) selected.add("whatsapp");
        setSelectedNotify(selected);
      } catch {
        toast.error("Could not load saved progress");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleFile = async (file: File) => {
    setUploading(true);
    setResumeConfirmed(false);
    try {
      const uploaded = await uploadResumeFile(file);
      if (isSeedResume(uploaded.rawText)) {
        toast.error("That looks like the example resume — upload yours");
        return;
      }
      if (!uploaded.hasFile) {
        toast.error("Could not keep the file — try a PDF or DOCX");
        setResumeText(uploaded.rawText);
        setResumeFileName(null);
        return;
      }
      setResumeText(uploaded.rawText);
      setResumeFileName(uploaded.fileName);
      setMissingFields((m) =>
        m.filter((f) => f !== "resume" && f !== "resume file")
      );
      toast.success(
        `Saved ${uploaded.fileName} · review the extracted text below`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const persistCurrentStep = useCallback(
    async (nextStep: number, complete = false) => {
      setSaving(true);
      try {
        await saveProgress({
          step: nextStep,
          complete,
          resumeText: hasOwnResume(resumeText) ? resumeText : undefined,
          accountEmails: sanitizeOnboardingEmails(emails),
          notifyEmail: selectedNotify.has("email") ? notifyEmail : "",
          notifyWhatsapp: selectedNotify.has("whatsapp") ? notifyWhatsapp : "",
        });
        try {
          localStorage.setItem("aply_onboarding_step", String(nextStep));
          if (complete) localStorage.setItem("aply_onboarding_done", "1");
        } catch {
          /* ignore */
        }
      } finally {
        setSaving(false);
      }
    },
    [
      resumeText,
      emails,
      notifyEmail,
      notifyWhatsapp,
      selectedNotify,
    ]
  );

  /** Collect every unfinished required section + field names */
  const findGaps = useCallback((): FieldGap[] => {
    const gaps: FieldGap[] = [];
    const resumeGaps: string[] = [];

    if (!resumeFileName) {
      resumeGaps.push("resume file");
    }
    if (!hasOwnResume(resumeText)) {
      resumeGaps.push("resume");
    } else if (!resumeConfirmed) {
      resumeGaps.push("confirm extracted text");
    }
    if (resumeGaps.length) {
      gaps.push({ step: 0, fields: resumeGaps });
    }

    const validEmails = sanitizeOnboardingEmails(emails).filter(isValidEmail);
    if (!validEmails.length) {
      gaps.push({ step: 1, fields: ["account email"] });
    }

    const notifyGaps: string[] = [];
    if (!selectedNotify.has("email") && !selectedNotify.has("whatsapp")) {
      notifyGaps.push("notification channel");
    } else {
      if (selectedNotify.has("email") && !isValidEmail(notifyEmail)) {
        notifyGaps.push("email");
      }
      if (selectedNotify.has("whatsapp") && notifyWhatsapp.trim().length < 8) {
        notifyGaps.push("WhatsApp");
      }
    }
    if (notifyGaps.length) {
      gaps.push({ step: 2, fields: notifyGaps });
    }

    return gaps;
  }, [
    resumeText,
    resumeFileName,
    resumeConfirmed,
    emails,
    notifyEmail,
    notifyWhatsapp,
    selectedNotify,
  ]);

  const toggleNotifyChannel = (id: NotifyChannelId) => {
    setSelectedNotify((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setMissingFields((m) => m.filter((f) => f !== "notification channel"));
  };

  const setNotifyDestination = (key: NotifyDestinationKey, value: string) => {
    if (key === "notifyEmail") {
      setNotifyEmail(value);
      if (isValidEmail(value)) {
        setMissingFields((m) => m.filter((f) => f !== "email"));
      }
    } else if (key === "notifyWhatsapp") {
      setNotifyWhatsapp(value);
      if (value.trim().length >= 8) {
        setMissingFields((m) => m.filter((f) => f !== "WhatsApp"));
      }
    }
  };

  const goToStep = async (target: number) => {
    setMissingFields([]);
    try {
      await persistCurrentStep(target, false);
    } catch {
      /* still navigate locally */
    }
    setStep(target);
  };

  const next = async () => {
    // Free navigation until the Done step — finish is when we enforce completion
    if (step < STEPS.length - 1) {
      await goToStep(step + 1);
      return;
    }

    const gaps = findGaps();
    if (gaps.length) {
      const first = gaps[0];
      const allFields = gaps.flatMap((g) => g.fields);
      const label = allFields.join(", ");
      toast.error("Finish these fields first:", {
        description: label,
      });
      setMissingFields(first.fields);
      try {
        await persistCurrentStep(first.step, false);
      } catch {
        /* ignore */
      }
      setStep(first.step);
      return;
    }

    try {
      await persistCurrentStep(4, true);
      toast.success("Workspace ready");
      router.push("/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not finish onboarding");
    }
  };

  const prev = async () => {
    if (step === 0) return;
    await goToStep(step - 1);
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Icon name="sync" size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fieldHint = (name: string) =>
    missingFields.includes(name) ? (
      <p className="text-xs text-destructive">Required — complete this to finish onboarding</p>
    ) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3 sm:px-6">
          <span className="font-heading font-semibold">Aply onboarding</span>
          <div className="ml-auto flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => goToStep(i)}
                title={s}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/40" : "w-4 bg-muted"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {step + 1}/{STEPS.length}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {missingFields.length > 0 && (
          <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <Icon name="alert" size={16} className="shrink-0" />
            <p className="min-w-0">
              Still missing: {missingFields.join(", ")}
            </p>
          </div>
        )}

        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-semibold">Upload your resume</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload a PDF or DOCX. Aply keeps the file for job forms, extracts the text for
                cover letters — then you confirm the extraction looks right.
              </p>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ACCEPTED_FILE_TYPES;
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFile(file);
                };
                input.click();
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-card p-12 text-center transition-all hover:border-primary",
                (missingFields.includes("resume") ||
                  missingFields.includes("resume file")) &&
                  "border-destructive",
                !missingFields.includes("resume") &&
                  !missingFields.includes("resume file") &&
                  "border-border"
              )}
            >
              {uploading ? (
                <Icon name="sync" size={32} className="animate-spin text-primary" />
              ) : (
                <Icon name="upload" size={32} className="text-muted-foreground" />
              )}
              <p className="text-sm font-medium text-foreground">
                {resumeFileName
                  ? `Uploaded · ${resumeFileName}`
                  : "Drop your resume here or click to browse"}
              </p>
              {hasOwnResume(resumeText) && (
                <p className="text-xs text-muted-foreground">
                  {resumeText.length} characters extracted — review below
                </p>
              )}
              <div className="flex gap-1">
                {["PDF", "DOCX"].map((f) => (
                  <span
                    key={f}
                    className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
            {fieldHint("resume file")}
            {fieldHint("resume")}

            <div className="space-y-2">
              <Label htmlFor="resume-extract">Extracted text</Label>
              <p className="text-xs text-muted-foreground">
                Check that names, roles, and dates look right. Fix anything wrong before confirming.
              </p>
              <div className="relative">
                {!resumeText.trim() && (
                  <pre
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap p-3 font-mono text-sm leading-relaxed text-muted-foreground/55"
                  >
                    {RESUME_PLACEHOLDER}
                  </pre>
                )}
                <Textarea
                  id="resume-extract"
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    setResumeConfirmed(false);
                    if (hasOwnResume(e.target.value)) {
                      setMissingFields((m) =>
                        m.filter(
                          (f) => f !== "resume" && f !== "confirm extracted text"
                        )
                      );
                    }
                  }}
                  className={cn(
                    "relative min-h-56 bg-transparent font-mono text-sm",
                    (missingFields.includes("resume") ||
                      missingFields.includes("confirm extracted text")) &&
                      "border-destructive"
                  )}
                  placeholder=""
                  aria-label="Extracted resume text"
                />
              </div>

              {hasOwnResume(resumeText) && resumeFileName && (
                <button
                  type="button"
                  onClick={() => {
                    setResumeConfirmed((v) => {
                      const next = !v;
                      if (next) {
                        setMissingFields((m) =>
                          m.filter((f) => f !== "confirm extracted text")
                        );
                      }
                      return next;
                    });
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                    resumeConfirmed
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : missingFields.includes("confirm extracted text")
                        ? "border-destructive bg-destructive/5 text-destructive"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                      resumeConfirmed
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40"
                    )}
                    aria-hidden
                  >
                    {resumeConfirmed ? <Icon name="check" size={12} /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="font-medium">
                      Extraction looks correct
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Required before finishing onboarding
                    </span>
                  </span>
                </button>
              )}
              {fieldHint("confirm extracted text")}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-semibold">Account emails</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Aply uses these to create accounts on job sites when needed.
              </p>
            </div>
            <div className="space-y-2">
              {emails.map((email, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const nextEmails = [...emails];
                      nextEmails[i] = e.target.value;
                      setEmails(nextEmails);
                      if (sanitizeOnboardingEmails(nextEmails).some(isValidEmail)) {
                        setMissingFields((m) => m.filter((f) => f !== "account email"));
                      }
                    }}
                    placeholder={`you${i + 1}@example.com`}
                    className={cn(
                      "touch-target",
                      missingFields.includes("account email") && "border-destructive"
                    )}
                  />
                  {emails.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEmails(emails.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground"
                    >
                      <Icon name="x" size={14} />
                    </Button>
                  )}
                </div>
              ))}
              {fieldHint("account email")}
              <Button
                variant="outline"
                onClick={() => setEmails([...emails, ""])}
                className="border-dashed"
              >
                <Icon name="plus" size={14} />
                Add another email
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-semibold">Notifications</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose how Aply reaches you, then add your details.
              </p>
            </div>

            <div
              className={cn(
                missingFields.includes("notification channel") &&
                  "rounded-lg ring-1 ring-destructive"
              )}
            >
              <NotifyChannelsConfig
                selected={selectedNotify}
                destinations={{
                  notifyEmail,
                  notifyWhatsapp,
                }}
                onToggle={toggleNotifyChannel}
                onDestinationChange={setNotifyDestination}
              />
            </div>
            {fieldHint("notification channel")}
            {selectedNotify.has("email") && fieldHint("email")}
            {selectedNotify.has("whatsapp") && fieldHint("WhatsApp")}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-semibold">Connect job platforms</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Optional — connect boards that need a login. Platforms without login are already checked as managed.
              </p>
            </div>
            <OnboardingPlatformsList />
            <p className="text-xs text-muted-foreground">
              Aply opens the platform so you can log in. Credentials stay local.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center gap-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon name="check" size={32} />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-semibold">Ready when you are</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Click below to open the dashboard. If anything required is missing, we&apos;ll send you back to finish it.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={prev}
            disabled={step === 0 || saving}
            className="text-muted-foreground"
          >
            Back
          </Button>
          <Button onClick={next} disabled={saving || uploading} className="gap-2">
            {saving ? (
              <Icon name="sync" size={14} className="animate-spin" />
            ) : (
              <>
                {step === STEPS.length - 1 ? "Go to dashboard" : "Continue"}
                <Icon name="arrow-right" size={14} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
