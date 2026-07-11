"use client";
/**
 * Onboarding flow - collects everything Aply needs to start:
 * Step 1: Resume upload (PDF/DOCX/TXT)
 * Step 2: Account emails (for creating accounts on job sites)
 * Step 3: Notification preferences (WhatsApp, email, language)
 * Step 4: Platform logins (connect to job boards that require auth)
 * Step 5: Done -> redirect to dashboard
 */
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Icon } from "@/components/aply/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { extractTextFromFile, ACCEPTED_FILE_TYPES } from "@/lib/file-extract";
import { cn } from "@/lib/utils";

const STEPS = ["Resume", "Emails", "Notifications", "Platforms", "Done"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [resumeText, setResumeText] = useState("");
  const [emails, setEmails] = useState<string[]>([""]);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyWhatsapp, setNotifyWhatsapp] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const text = await extractTextFromFile(file);
      setResumeText(text);
      toast.success(`Extracted ${text.length} characters`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setUploading(false);
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else router.push("/dashboard");
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Progress bar */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3 sm:px-6">
          <Icon name="rocket" size={20} className="text-primary" />
          <span className="font-heading font-semibold">Aply onboarding</span>
          <div className="ml-auto flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/40" : "w-4 bg-muted"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{step + 1}/{STEPS.length}</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {/* Step 0: Resume */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-semibold">Upload your resume</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Aply uses this to draft cover letters and answer application questions. PDF, DOCX, or TXT.
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
              className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-card p-12 text-center transition-all hover:border-primary"
            >
              {uploading ? (
                <Icon name="sync" size={32} className="animate-spin text-primary" />
              ) : (
                <Icon name="upload" size={32} className="text-muted-foreground" />
              )}
              <p className="text-sm font-medium text-foreground">
                {resumeText ? `${resumeText.length} characters extracted` : "Drop your resume here or click to browse"}
              </p>
              <div className="flex gap-1">
                {["PDF", "DOCX", "TXT"].map((f) => (
                  <span key={f} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{f}</span>
                ))}
              </div>
            </div>

            {resumeText && (
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="h-40 font-mono text-sm"
                placeholder="Or paste your resume text here..."
              />
            )}
          </div>
        )}

        {/* Step 1: Emails */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-semibold">Account emails</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Aply uses these emails to create accounts on job sites when needed. Add 2-3 different ones.
              </p>
            </div>
            <div className="space-y-2">
              {emails.map((email, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const next = [...emails];
                      next[i] = e.target.value;
                      setEmails(next);
                    }}
                    placeholder={`email${i + 1}@example.com`}
                    className="touch-target"
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

        {/* Step 2: Notifications */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-semibold">Notifications</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                How should Aply reach you when a draft is ready for approval?
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email for approvals</Label>
                <Input type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} placeholder="you@example.com" className="touch-target" />
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp number</Label>
                <Input type="tel" value={notifyWhatsapp} onChange={(e) => setNotifyWhatsapp(e.target.value)} placeholder="+33 6 12 34 56 78" className="touch-target" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Prefer career page</p>
                  <p className="text-xs text-muted-foreground">Apply via company career page when possible</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Platforms */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-semibold">Connect job platforms</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Log in to the job boards you use. Aply captures your session so it can apply on your behalf. You can skip this and do it later.
              </p>
            </div>
            <div className="space-y-2">
              {["LinkedIn", "Indeed", "Welcome to the Jungle", "Upwork"].map((platform) => (
                <div key={platform} className="flex items-center justify-between rounded-lg bg-card px-4 py-3 ring-1 ring-border/40">
                  <div className="flex items-center gap-3">
                    <Icon name="globe" size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium">{platform}</span>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Icon name="link-external" size={12} />
                    Connect
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Aply opens a secure browser window for you to log in. Your credentials are stored locally and never sent to any server.
            </p>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="flex flex-col items-center gap-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon name="check" size={32} />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-semibold">You're all set!</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Aply is now monitoring 190+ job boards. You'll get a notification when a draft is ready.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={prev} disabled={step === 0} className="text-muted-foreground">
            Back
          </Button>
          <Button onClick={next} className="gap-2">
            {step === STEPS.length - 1 ? "Go to dashboard" : "Continue"}
            <Icon name="arrow-right" size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
