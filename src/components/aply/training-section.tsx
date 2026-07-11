"use client";
/**
 * TrainingSection · "Your voice, learned" · past applications list + add form.
 */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/components/aply/icon";
import { LangBadge } from "@/components/aply/badges";
import type {
  PastApplication,
  PastApplicationListResponse,
} from "@/components/aply/types";
import { apiFetch, truncate } from "@/components/aply/utils";
import { useI18n } from "@/components/aply/i18n";

const OUTCOME_CLS: Record<string, string> = {
  accepted: "bg-[#2ea043]/12 text-[#2ea043] border-[#2ea043]/30",
  rejected: "bg-[#B23A1E]/10 text-[#B23A1E] border-[#B23A1E]/30",
  no_answer: "bg-[#79695E]/12 text-muted-foreground border-[#79695E]/30",
  manual: "bg-background text-muted-foreground border-border",
};

const OUTCOME_VALUES = ["manual", "accepted", "rejected", "no_answer"] as const;

interface TrainingSectionProps {
  onCountChange?: (n: number) => void;
}

export function TrainingSection({ onCountChange }: TrainingSectionProps) {
  const { t } = useI18n();
  const [items, setItems] = useState<PastApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form state
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [language, setLanguage] = useState("en");
  const [outcome, setOutcome] = useState("manual");
  const [coverLetter, setCoverLetter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<PastApplicationListResponse>(
        "/api/past-applications"
      );
      setItems(res.items);
      onCountChange?.(res.items.length);
    } catch (e) {
      toast.error(t("training.toast.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/past-applications?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success(t("training.toast.removed"));
    } catch (e) {
      toast.error(t("training.toast.deleteFailed"));
    }
  };

  const handleAdd = async () => {
    if (!jobTitle || !coverLetter) {
      toast.error(t("training.toast.required"));
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/past-applications", {
        method: "POST",
        body: JSON.stringify({
          jobTitle,
          company: company || null,
          coverLetter,
          language,
          outcome,
        }),
      });
      toast.success(t("training.added"));
      setJobTitle("");
      setCompany("");
      setCoverLetter("");
      setOutcome("manual");
      setLanguage("en");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("training.toast.addFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      id="training"
      aria-labelledby="training-heading"
      className="px-4 py-12 md:px-6 md:py-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {t("training.eyebrow")}
          </span>
          <h2
            id="training-heading"
            className="font-heading text-3xl font-semibold leading-tight text-foreground md:text-4xl"
          >
            {t("training.title")}
          </h2>
          <p className="max-w-2xl text-base text-muted-foreground">
            {t("training.subtitle")}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left: list */}
          <Card className="gap-3 rounded-xl border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold text-foreground">
                {t("training.past")}
              </h3>
              <span className="text-xs text-muted-foreground">
                {items.length} {t("training.inSet")}
              </span>
            </div>
            <ScrollArea className="h-[26rem]">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-24 rounded-lg border border-border bg-background"
                    />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-background px-6 py-10 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-primary">
                    <Icon name="comment-discussion" size={18} />
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {t("training.empty")}
                  </p>
                </div>
              ) : (
                <ul className="space-y-3 pr-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-border bg-background p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">
                            {item.jobTitle}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.company ?? "-"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <LangBadge lang={item.language} />
                          {item.outcome && (
                            <span
                              className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                                OUTCOME_CLS[item.outcome] ?? OUTCOME_CLS.manual
                              }`}
                            >
                              {t(`training.outcome.${item.outcome}`)}
                            </span>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={t("training.remove")}
                            onClick={() => handleDelete(item.id)}
                            className="h-7 w-7 text-muted-foreground hover:bg-card hover:text-[#B23A1E]"
                          >
                            <Icon name="x" size={12} />
                          </Button>
                        </div>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {truncate(item.coverLetter, 120)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </Card>

          {/* Right: form */}
          <Card className="gap-4 rounded-xl border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Icon name="plus" size={14} />
              </span>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                {t("training.add")}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("training.formDesc")}
            </p>

            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="pa-job">{t("training.jobTitle")}</Label>
                <Input
                  id="pa-job"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder={t("training.placeholder.jobTitle")}
                  className="bg-background"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pa-company">{t("training.companyOptional")}</Label>
                <Input
                  id="pa-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={t("training.placeholder.company")}
                  className="bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>{t("training.language")}</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t("training.lang.en")}</SelectItem>
                      <SelectItem value="fr">{t("training.lang.fr")}</SelectItem>
                      <SelectItem value="de">{t("training.lang.de")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{t("training.outcome")}</Label>
                  <Select value={outcome} onValueChange={setOutcome}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTCOME_VALUES.map((o) => (
                        <SelectItem key={o} value={o}>
                          {t(`training.outcome.${o}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pa-cover">{t("training.coverLetter")}</Label>
                <Textarea
                  id="pa-cover"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder={t("training.placeholder.coverLetter")}
                  className="h-40 bg-background"
                />
              </div>
              <Button
                onClick={handleAdd}
                disabled={saving}
                className="bg-primary text-primary-foreground hover:bg-accent hover:text-foreground"
              >
                {saving ? (
                  <Icon name="sync" size={14} className="animate-spin" />
                ) : (
                  <Icon name="plus" size={14} />
                )}
                {t("training.addBtn")}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
