"use client";
/**
 * ResumeSection · current default resume + edit dialog + file upload (PDF/DOCX/TXT).
 */
import { useCallback, useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Icon } from "@/components/aply/icon";
import type { Resume, ResumeListResponse } from "@/components/aply/types";
import { apiFetch } from "@/components/aply/utils";
import { useI18n } from "@/components/aply/i18n";
import { extractTextFromFile, ACCEPTED_FILE_TYPES } from "@/lib/file-extract";
import { cn } from "@/lib/utils";

export function ResumeSection() {
  const { t } = useI18n();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<ResumeListResponse>("/api/resume");
      const def = res.items.find((r) => r.isDefault) ?? res.items[0] ?? null;
      setResume(def);
      if (def) setDraft(def.rawText);
    } catch (e) {
      toast.error(t("resume.toast.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!resume) return;
    setSaving(true);
    try {
      await apiFetch("/api/resume", {
        method: "PATCH",
        body: JSON.stringify({ id: resume.id, rawText: draft }),
      });
      toast.success(t("resume.saved"));
      setOpen(false);
      load();
    } catch (e) {
      toast.error(t("resume.toast.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    toast.loading(t("resume.upload.extracting"), { id: "upload" });
    try {
      const text = await extractTextFromFile(file);
      if (resume) {
        // Update existing resume
        await apiFetch("/api/resume", {
          method: "PATCH",
          body: JSON.stringify({ id: resume.id, rawText: text }),
        });
      } else {
        // Create new resume
        await apiFetch("/api/resume", {
          method: "POST",
          body: JSON.stringify({
            rawText: text,
            label: file.name.replace(/\.[^.]+$/, ""),
            isDefault: true,
          }),
        });
      }
      toast.success(
        t("resume.upload.success").replace("{chars}", text.length.toLocaleString()),
        { id: "upload" }
      );
      load();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("resume.upload.failed"),
        { id: "upload" }
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const skills = resume?.structured?.skills ?? [];

  return (
    <section
      id="resume"
      aria-labelledby="resume-heading"
      className="px-4 py-12 md:px-6 md:py-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#C65D00]">
            <span className="h-px w-6 bg-[#C65D00]/40" aria-hidden />
            {t("resume.eyebrow")}
          </span>
          <h2
            id="resume-heading"
            className="font-heading text-3xl font-semibold leading-tight text-[#4A2F1A] md:text-4xl dark:text-[#FFE4B5]"
          >
            {t("resume.title")}
          </h2>
          <p className="max-w-2xl text-base text-[#79695E] dark:text-[#C9B89F]">
            {t("resume.subtitle")}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Resume display card · spans 2 cols */}
          <Card className="gap-4 rounded-xl border-[#CFC5BE] bg-[#FFF4DC] p-6 lg:col-span-2 dark:bg-[#3A2417]">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : !resume ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[#CFC5BE] bg-[#FFE4B5] px-6 py-12 text-center dark:bg-[#4A2F1A]">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF4DC] text-[#C65D00] dark:bg-[#3A2417]">
                  <Icon name="file" size={20} />
                </span>
                <p className="text-sm text-[#79695E] dark:text-[#C9B89F]">
                  {t("resume.empty")}
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C65D00] text-[#FFE4B5]">
                      <Icon name="file" size={18} />
                    </span>
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-[#4A2F1A] dark:text-[#FFE4B5]">
                        {resume.label}
                      </h3>
                      <p className="text-xs text-[#79695E] dark:text-[#C9B89F]">
                        {t("resume.languageLabel")}{" "}
                        <span className="font-medium uppercase">
                          {resume.language}
                        </span>{" "}
                        · {resume.rawText.length.toLocaleString()} {t("resume.chars")}
                      </p>
                    </div>
                  </div>
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-[#C65D00] text-[#C65D00] hover:bg-[#FFE4B5] dark:border-[#FF9F1C] dark:text-[#FF9F1C] dark:hover:bg-[#4A2F1A]"
                      >
                        <Icon name="pencil" size={14} />
                        {t("resume.edit")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#FFF4DC] sm:max-w-2xl dark:bg-[#3A2417]">
                      <DialogHeader>
                        <DialogTitle className="font-heading text-xl text-[#4A2F1A] dark:text-[#FFE4B5]">
                          {t("resume.edit")}
                        </DialogTitle>
                        <DialogDescription className="text-[#79695E] dark:text-[#C9B89F]">
                          {t("resume.dialogDesc")}
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="h-80 bg-[#FFE4B5] font-mono text-sm dark:bg-[#4A2F1A] dark:text-[#FFE4B5]"
                      />
                      <DialogFooter>
                        <Button
                          variant="ghost"
                          onClick={() => setOpen(false)}
                          disabled={saving}
                          className="text-[#79695E] dark:text-[#C9B89F]"
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-[#C65D00] text-[#FFE4B5] hover:bg-[#FF9F1C] hover:text-[#4A2F1A]"
                        >
                          {saving ? (
                            <Icon name="sync" size={14} className="animate-spin" />
                          ) : (
                            <Icon name="check" size={14} />
                          )}
                          {t("common.save")}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[#79695E] dark:text-[#C9B89F]">
                      {t("resume.skills")}
                    </span>
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center rounded border border-[#C65D00]/30 bg-[#C65D00]/10 px-1.5 py-0.5 text-[11px] font-medium text-[#C65D00] dark:border-[#FF9F1C]/30 dark:bg-[#FF9F1C]/10 dark:text-[#FF9F1C]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <ScrollArea className="h-48 rounded-md border border-[#CFC5BE] bg-[#FFE4B5] dark:bg-[#4A2F1A]">
                  <pre className="whitespace-pre-wrap p-3 text-sm leading-relaxed text-[#4A2F1A] dark:text-[#FFE4B5]">
                    {resume.rawText}
                  </pre>
                </ScrollArea>
              </>
            )}
          </Card>

          {/* Upload card · 1 col */}
          <Card className="gap-3 rounded-xl border-[#CFC5BE] bg-[#FFF4DC] p-5 dark:bg-[#3A2417]">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF9F1C]/15 text-[#C65D00] dark:bg-[#FF9F1C]/20 dark:text-[#FF9F1C]">
                <Icon name="upload" size={16} />
              </span>
              <h3 className="font-heading text-base font-semibold text-[#4A2F1A] dark:text-[#FFE4B5]">
                {t("resume.upload")}
              </h3>
            </div>
            <p className="text-xs text-[#79695E] dark:text-[#C9B89F]">
              {t("resume.upload.desc")}
            </p>

            {/* Drag & drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              aria-label={t("resume.upload.drag")}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-all",
                dragOver
                  ? "border-[#C65D00] bg-[#C65D00]/10 scale-[1.02]"
                  : "border-[#CFC5BE] bg-[#FFE4B5] hover:border-[#C65D00] hover:bg-[#FFE4B5]/60 dark:border-[#5A3D26] dark:bg-[#4A2F1A] dark:hover:border-[#FF9F1C]",
                uploading && "pointer-events-none opacity-60"
              )}
            >
              {uploading ? (
                <>
                  <Icon name="sync" size={24} className="animate-spin text-[#C65D00]" />
                  <p className="text-xs font-medium text-[#C65D00]">
                    {t("resume.upload.extracting")}
                  </p>
                </>
              ) : dragOver ? (
                <>
                  <Icon name="download" size={24} className="text-[#C65D00]" />
                  <p className="text-xs font-medium text-[#C65D00]">
                    {t("resume.upload.dragging")}
                  </p>
                </>
              ) : (
                <>
                  <Icon
                    name="upload"
                    size={24}
                    className="text-[#79695E] dark:text-[#C9B89F]"
                  />
                  <p className="text-xs text-[#79695E] dark:text-[#C9B89F]">
                    {t("resume.upload.drag")}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
                    {["PDF", "DOCX", "TXT", "MD"].map((fmt) => (
                      <span
                        key={fmt}
                        className="rounded border border-[#CFC5BE] bg-[#FFF4DC] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#79695E] dark:border-[#5A3D26] dark:bg-[#3A2417] dark:text-[#C9B89F]"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
