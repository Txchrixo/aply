"use client";
/**
 * ApplicationDetailDrawer · slide-in panel showing full application details.
 * Opens when a history row or monitoring item is clicked.
 * Shows: cover letter, form fields, quality score, job details, plus rich
 * context fetched from /api/jobs/{jobOfferId}/details (company, cross-refs,
 * form requirements, account credential, import pipeline status).
 */
import { useEffect, useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/aply/icon";
import {
  ContractBadge,
  LangBadge,
  QualityRing,
  StatusBadge,
} from "@/components/aply/badges";
import { useI18n } from "@/components/aply/i18n";
import {
  apiFetch,
  initials,
  logoColor,
  relativeTime,
  truncate,
} from "@/components/aply/utils";
import type { Application } from "@/components/aply/types";
import { toast } from "sonner";

interface ApplicationDetailDrawerProps {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: () => void;
  /**
   * Whether Aply is configured to prefer applying via the company career page
   * over the job board. Comes from settings.preferCareerPage. Defaults to true
   * so the "prefer direct application" hint surfaces for seeded users.
   */
  preferCareerPage?: boolean;
}

// ---- Types mirroring /api/jobs/[id]/details response -------------------------

interface DetailsPlatform {
  name: string;
  url: string | null;
}
interface DetailsCareerPage {
  url: string;
  atsSystem: string | null;
  jobsBoardUrl: string | null;
}
interface DetailsCompany {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  linkedinUrl: string | null;
  careerPages: DetailsCareerPage[];
}
interface DetailsCrossRefOffer {
  id: string;
  title: string;
  company: string | null;
  url: string;
  platform?: { name: string } | null;
  applicationSource: string | null;
  status: string;
}
interface DetailsCrossReference {
  id: string;
  source: string;
  confidence: number;
  url: string;
  offer: DetailsCrossRefOffer;
}
interface DetailsFormRequirement {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  isRequired: boolean;
  options: string[] | null;
  placeholder: string | null;
  detectionSelector: string | null;
}
interface DetailsCredential {
  id: string;
  email: string;
  status: string;
}
interface DetailsApplication {
  id: string;
  status: string;
  submittedVia: string | null;
  credentialId: string | null;
  qualityScore: number | null;
}
interface DetailsOffer {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  url: string;
  description: string | null;
  contractType: string | null;
  language: string | null;
  salary: string | null;
  status: string;
  importProgress: number | null;
  importStep: string | null;
  applicationSource: string | null;
  platform: DetailsPlatform | null;
}
interface JobDetails {
  offer: DetailsOffer;
  company: DetailsCompany | null;
  crossReferences: DetailsCrossReference[];
  formRequirements: DetailsFormRequirement[];
  credential: DetailsCredential | null;
  application: DetailsApplication | null;
}

// ---- Small local helpers ------------------------------------------------------

const ATS_LABEL: Record<string, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  workday: "Workday",
  ashby: "Ashby",
};

const SOURCE_LABEL: Record<string, string> = {
  career_page: "Career page",
  job_board: "Job board",
  linkedin: "LinkedIn",
};

const SOURCE_ICON: Record<string, string> = {
  career_page: "globe",
  job_board: "briefcase",
  linkedin: "link-external",
};

const FIELD_TYPE_LABEL: Record<string, string> = {
  text: "text",
  email: "email",
  tel: "tel",
  textarea: "textarea",
  select: "select",
  file: "file",
  checkbox: "checkbox",
};

const IMPORT_STEP_LABEL: Record<string, string> = {
  detecting_fields: "Detecting form fields",
  generating_letter: "Generating cover letter",
  filling_form: "Filling form fields",
  ready: "Ready",
};

function importStepLabel(step: string | null | undefined): string {
  if (!step) return "Working…";
  return IMPORT_STEP_LABEL[step] ?? step;
}

export function ApplicationDetailDrawer({
  applicationId,
  open,
  onOpenChange,
  onApprove,
  preferCareerPage = true,
}: ApplicationDetailDrawerProps) {
  const { t } = useI18n();
  const [app, setApp] = useState<Application | null>(null);
  const [details, setDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  const load = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    setApp(null);
    setDetails(null);
    try {
      const application = await apiFetch<Application>(
        `/api/applications/${applicationId}`
      );
      setApp(application);
      const jobOfferId = application.jobOffer?.id;
      if (jobOfferId) {
        try {
          const d = await apiFetch<JobDetails>(
            `/api/jobs/${jobOfferId}/details`
          );
          setDetails(d);
        } catch {
          // Details are best-effort enrichment; the drawer still works without them.
        }
      }
    } catch {
      toast.error("Failed to load application");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (open && applicationId) load();
  }, [open, applicationId, load]);

  const handleApprove = async () => {
    if (!app) return;
    setBusy("approve");
    try {
      await apiFetch(`/api/applications/${app.id}/approve`, {
        method: "POST",
        body: JSON.stringify({ channel: "dashboard" }),
      });
      toast.success(t("approvals.approved"));
      onOpenChange(false);
      onApprove?.();
    } catch {
      toast.error("Failed to approve");
    } finally {
      setBusy(null);
    }
  };

  const job = app?.jobOffer;
  const offer = details?.offer;
  const company = details?.company ?? null;
  const crossRefs = details?.crossReferences ?? [];
  const formReqs = details?.formRequirements ?? [];
  const credential = details?.credential ?? null;
  const platformName = offer?.platform?.name ?? job?.platform?.name ?? null;

  const importProgress = offer?.importProgress ?? null;
  const importStep = offer?.importStep ?? null;
  const isImporting =
    offer?.status === "importing" ||
    (importProgress !== null && importProgress < 100);

  const applicationSource = offer?.applicationSource ?? null;
  const showPreferCareerHint =
    preferCareerPage &&
    applicationSource === "job_board" &&
    crossRefs.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-border bg-card p-0 sm:max-w-lg dark:border-[#5A3D26] dark:bg-[#3A2417]"
        aria-describedby={undefined}
      >
        {/* Always-present title for accessibility */}
        <SheetHeader className="border-b border-border px-6 py-4 dark:border-[#5A3D26]">
          <SheetTitle className="font-heading text-xl font-semibold text-foreground dark:text-primary-foreground">
            {loading
              ? "Loading…"
              : !app || !job
              ? "Application not found"
              : job.title}
          </SheetTitle>
          <SheetDescription className="mt-1 text-sm text-muted-foreground dark:text-[#C9B89F]">
            {loading
              ? "Fetching application details"
              : !app || !job
              ? "The application you're looking for doesn't exist."
              : `${job.company ?? "-"}${platformName ? ` · via ${platformName}` : ""}`}
          </SheetDescription>
        </SheetHeader>
        {loading ? (
          <div className="flex h-full items-center justify-center p-8">
            <Icon name="sync" size={24} className="animate-spin text-primary dark:text-[#FF9F1C]" />
          </div>
        ) : !app || !job ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <Icon name="inbox" size={32} className="text-muted-foreground dark:text-[#C9B89F]" />
            <p className="text-sm text-muted-foreground dark:text-[#C9B89F]">Application not found.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 px-6 pb-3">
              <div className="min-w-0 flex-1">
                <p className="font-heading text-xl font-semibold text-foreground dark:text-primary-foreground">
                  {job.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground dark:text-[#C9B89F]">
                  {job.company ?? "-"}
                  {platformName ? ` · via ${platformName}` : ""}
                </p>
              </div>
              <QualityRing score={app.qualityScore ?? 0} />
            </div>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-1.5 px-6 pb-3">
              <StatusBadge status={app.status} />
              {job.contractType && <ContractBadge type={job.contractType} />}
              {app.language && <LangBadge lang={app.language} />}
              {job.location && (
                <span className="text-xs text-muted-foreground dark:text-[#C9B89F]">
                  · {job.location}
                </span>
              )}
              {job.salary && (
                <span className="text-xs text-muted-foreground dark:text-[#C9B89F]">
                  · {job.salary}
                </span>
              )}
            </div>

            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-5 px-6 py-5">
                {/* Job description */}
                {job.description && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary dark:text-[#FF9F1C]">
                      <Icon name="book" size={12} />
                      Job description
                    </h3>
                    <p className="rounded-lg border border-border bg-background p-3 text-sm leading-relaxed text-foreground dark:border-[#5A3D26] dark:bg-[#4A2F1A] dark:text-primary-foreground">
                      {job.description}
                    </p>
                  </div>
                )}

                {/* Cover letter */}
                {app.coverLetter && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary dark:text-[#FF9F1C]">
                      <Icon name="pencil" size={12} />
                      Cover letter
                    </h3>
                    <ScrollArea className="h-64 rounded-lg border border-border bg-background dark:border-[#5A3D26] dark:bg-[#4A2F1A]">
                      <pre className="whitespace-pre-wrap p-3 text-sm leading-relaxed text-foreground dark:text-primary-foreground">
                        {app.coverLetter}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                {/* Form fields (filled values from the application) */}
                {app.formFields && app.formFields.length > 0 && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary dark:text-[#FF9F1C]">
                      <Icon name="list-unordered" size={12} />
                      Form fields
                    </h3>
                    <div className="space-y-1.5">
                      {app.formFields.map((field, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2 dark:border-[#5A3D26] dark:bg-[#4A2F1A]"
                        >
                          <span className="flex h-5 w-16 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-medium uppercase text-primary dark:bg-accent/15 dark:text-[#FF9F1C]">
                            {field.type ?? "text"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-foreground dark:text-primary-foreground">
                              {field.selector}
                            </p>
                            <p className="truncate text-xs text-muted-foreground dark:text-[#C9B89F]">
                              {field.value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Import status (when still in pipeline) */}
                {isImporting && (
                  <div className="rounded-lg border border-[#C65D00]/40 bg-primary/8 p-3 dark:border-[#FF9F1C]/40 dark:bg-accent/10">
                    <div className="mb-2 flex items-center gap-2">
                      <Icon
                        name="sync"
                        size={14}
                        className="animate-spin text-primary dark:text-[#FF9F1C]"
                      />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary dark:text-[#FF9F1C]">
                        Importing
                      </h3>
                      <span className="ml-auto text-xs font-medium text-muted-foreground dark:text-[#C9B89F]">
                        {importProgress ?? 0}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-background dark:bg-[#4A2F1A]">
                      <div
                        className="h-full rounded-full bg-primary transition-all dark:bg-accent"
                        style={{ width: `${importProgress ?? 0}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground dark:text-[#C9B89F]">
                      {importStepLabel(importStep)}…
                    </p>
                  </div>
                )}

                {/* Company info */}
                {company && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary dark:text-[#FF9F1C]">
                      <Icon name="organization" size={12} />
                      Company
                    </h3>
                    <div className="rounded-lg border border-border bg-background p-3 dark:border-[#5A3D26] dark:bg-[#4A2F1A]">
                      <div className="flex items-start gap-3">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-primary-foreground"
                          style={{ backgroundColor: logoColor(company.name) }}
                          aria-hidden
                        >
                          {initials(company.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {company.website ? (
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate font-medium text-foreground underline-offset-2 hover:underline dark:text-primary-foreground"
                              >
                                {company.name}
                              </a>
                            ) : (
                              <p className="truncate font-medium text-foreground dark:text-primary-foreground">
                                {company.name}
                              </p>
                            )}
                            {company.industry && (
                              <span className="inline-flex items-center rounded border border-[#C65D00]/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary dark:border-[#FF9F1C]/40 dark:bg-accent/15 dark:text-[#FF9F1C]">
                                {company.industry}
                              </span>
                            )}
                            {company.size && (
                              <span className="inline-flex items-center rounded border border-[#79695E]/30 bg-[#79695E]/10 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground dark:border-[#C9B89F]/40 dark:bg-[#C9B89F]/15 dark:text-[#C9B89F]">
                                <Icon name="people" size={9} className="mr-1" />
                                {company.size}
                              </span>
                            )}
                          </div>
                          {company.careerPages.length > 0 && (
                            <p className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground dark:text-[#C9B89F]">
                              <Icon name="browser" size={11} />
                              <span className="truncate">{company.careerPages[0].url}</span>
                              {company.careerPages[0].atsSystem && (
                                <span className="ml-1 inline-flex items-center rounded border border-[#8B4513]/30 bg-[#8B4513]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#8B4513] dark:border-[#D2691E]/40 dark:bg-[#D2691E]/15 dark:text-[#D2691E]">
                                  {ATS_LABEL[company.careerPages[0].atsSystem] ?? company.careerPages[0].atsSystem}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Links row */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {company.website && (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="h-7 gap-1 border-border px-2 text-xs text-foreground hover:bg-card dark:border-[#5A3D26] dark:text-primary-foreground dark:hover:bg-[#3A2417]"
                          >
                            <a href={company.website} target="_blank" rel="noopener noreferrer">
                              <Icon name="globe" size={11} />
                              Website
                            </a>
                          </Button>
                        )}
                        {company.careerPages.map((cp, idx) => (
                          <Button
                            key={cp.url + idx}
                            size="sm"
                            variant="outline"
                            asChild
                            className="h-7 gap-1 border-border px-2 text-xs text-foreground hover:bg-card dark:border-[#5A3D26] dark:text-primary-foreground dark:hover:bg-[#3A2417]"
                          >
                            <a href={cp.url} target="_blank" rel="noopener noreferrer">
                              <Icon name="browser" size={11} />
                              Career page
                            </a>
                          </Button>
                        ))}
                        {company.linkedinUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="h-7 gap-1 border-border px-2 text-xs text-foreground hover:bg-card dark:border-[#5A3D26] dark:text-primary-foreground dark:hover:bg-[#3A2417]"
                          >
                            <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer">
                              <Icon name="link-external" size={11} />
                              LinkedIn
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Application source */}
                {applicationSource && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary dark:text-[#FF9F1C]">
                      <Icon name="tag" size={12} />
                      Application source
                    </h3>
                    <div className="rounded-lg border border-border bg-background p-3 dark:border-[#5A3D26] dark:bg-[#4A2F1A]">
                      {applicationSource === "career_page" ? (
                        <div className="flex items-start gap-2">
                          <span className="inline-flex items-center gap-1 rounded border border-[#2ea043]/30 bg-[#2ea043]/12 px-2 py-0.5 text-[11px] font-medium text-[#2ea043] dark:border-[#2ea043]/40 dark:bg-[#2ea043]/15 dark:text-[#2ea043]">
                            <Icon name="check-circle" size={11} />
                            Direct application (career page)
                          </span>
                          <p className="mt-0.5 text-xs text-muted-foreground dark:text-[#C9B89F]">
                            Applied directly on the company's career page, bypassing the job board.
                          </p>
                        </div>
                      ) : applicationSource === "job_board" ? (
                        <div className="flex items-start gap-2">
                          <span className="inline-flex items-center gap-1 rounded border border-[#C65D00]/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary dark:border-[#FF9F1C]/40 dark:bg-accent/15 dark:text-[#FF9F1C]">
                            <Icon name="briefcase" size={11} />
                            Via job board
                            {platformName ? ` · ${platformName}` : ""}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded border border-[#79695E]/30 bg-[#79695E]/10 px-2 py-0.5 text-[11px] font-medium text-muted-foreground dark:border-[#C9B89F]/40 dark:bg-[#C9B89F]/15 dark:text-[#C9B89F]">
                          {SOURCE_LABEL[applicationSource] ?? applicationSource}
                        </span>
                      )}
                      {showPreferCareerHint && (
                        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground dark:text-[#C9B89F]">
                          <Icon name="info" size={11} className="mt-0.5 shrink-0" />
                          Same job found on company career page. Aply prefers applying directly.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Cross-references */}
                {crossRefs.length > 0 && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary dark:text-[#FF9F1C]">
                      <Icon name="link" size={12} />
                      Also found on
                    </h3>
                    <div className="space-y-2">
                      {crossRefs.map((ref) => {
                        const pct = Math.round((ref.confidence ?? 0) * 100);
                        const sourceLabel = SOURCE_LABEL[ref.source] ?? ref.source;
                        const sourceIcon = SOURCE_ICON[ref.source] ?? "link";
                        return (
                          <div
                            key={ref.id}
                            className="rounded-md border border-border bg-background p-2.5 dark:border-[#5A3D26] dark:bg-[#4A2F1A]"
                          >
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded border border-[#79695E]/30 bg-[#79695E]/10 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground dark:border-[#C9B89F]/40 dark:bg-[#C9B89F]/15 dark:text-[#C9B89F]">
                                <Icon name={sourceIcon} size={10} />
                                {sourceLabel}
                              </span>
                              <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground dark:text-primary-foreground">
                                {ref.offer.title ?? ref.offer.platform?.name ?? "Same role"}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                                className="h-6 shrink-0 gap-1 border-border px-2 text-[10px] text-primary hover:bg-card dark:border-[#5A3D26] dark:text-[#FF9F1C] dark:hover:bg-[#3A2417]"
                              >
                                <a href={ref.url} target="_blank" rel="noopener noreferrer">
                                  <Icon name="link-external" size={10} />
                                  Open
                                </a>
                              </Button>
                            </div>
                            <p className="mt-1 truncate text-[10px] text-muted-foreground dark:text-[#C9B89F]">
                              {ref.url}
                            </p>
                            {ref.offer.platform?.name && (
                              <p className="mt-0.5 text-[10px] text-muted-foreground dark:text-[#C9B89F]">
                                on {ref.offer.platform.name}
                              </p>
                            )}
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="h-1 flex-1 overflow-hidden rounded-full bg-card dark:bg-[#3A2417]">
                                <div
                                  className="h-full rounded-full bg-primary dark:bg-accent"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-medium text-muted-foreground dark:text-[#C9B89F]">
                                {pct}% match
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Form requirements */}
                {formReqs.length > 0 && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary dark:text-[#FF9F1C]">
                      <Icon name="checklist" size={12} />
                      Form fields required by {platformName ?? "this platform"}
                    </h3>
                    <div className="space-y-1.5">
                      {formReqs.map((req) => (
                        <div
                          key={req.id}
                          className="rounded-md border border-border bg-background p-2.5 dark:border-[#5A3D26] dark:bg-[#4A2F1A]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-16 shrink-0 items-center justify-center rounded bg-[#8B4513]/10 text-[10px] font-medium uppercase text-[#8B4513] dark:bg-[#D2691E]/15 dark:text-[#D2691E]">
                              {FIELD_TYPE_LABEL[req.fieldType] ?? req.fieldType}
                            </span>
                            <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground dark:text-primary-foreground">
                              {req.fieldLabel || req.fieldKey}
                              {req.isRequired && (
                                <span className="ml-0.5 text-[#B23A1E]">*</span>
                              )}
                            </p>
                          </div>
                          {req.options && req.options.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {req.options.map((opt, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center rounded border border-border bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground dark:border-[#5A3D26] dark:bg-[#3A2417] dark:text-[#C9B89F]"
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                          {req.placeholder && (
                            <p className="mt-1 text-[10px] italic text-muted-foreground dark:text-[#C9B89F]">
                              placeholder: {truncate(req.placeholder, 80)}
                            </p>
                          )}
                          {req.detectionSelector && (
                            <pre className="mt-1.5 overflow-x-auto rounded bg-card p-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground dark:bg-[#3A2417] dark:text-[#C9B89F]">
                              {req.detectionSelector}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Account credential */}
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary dark:text-[#FF9F1C]">
                    <Icon name="key" size={12} />
                    Account used
                  </h3>
                  {credential ? (
                    <div className="rounded-lg border border-border bg-background p-3 dark:border-[#5A3D26] dark:bg-[#4A2F1A]">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-accent/15 dark:text-[#FF9F1C]">
                          <Icon name="mail" size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-foreground dark:text-primary-foreground">
                            {credential.email}
                          </p>
                          <p className="text-[10px] text-muted-foreground dark:text-[#C9B89F]">
                            {platformName ?? "this platform"}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                            credential.status === "created"
                              ? "border-[#2ea043]/30 bg-[#2ea043]/12 text-[#2ea043]"
                              : credential.status === "creating"
                              ? "border-[#C65D00]/30 bg-primary/10 text-primary dark:border-[#FF9F1C]/40 dark:bg-accent/15 dark:text-[#FF9F1C]"
                              : credential.status === "blocked"
                              ? "border-[#B23A1E]/30 bg-[#B23A1E]/10 text-[#B23A1E]"
                              : "border-[#79695E]/30 bg-[#79695E]/10 text-muted-foreground dark:border-[#C9B89F]/40 dark:bg-[#C9B89F]/15 dark:text-[#C9B89F]"
                          }`}
                        >
                          {credential.status === "created" && <Icon name="check" size={9} className="mr-0.5" />}
                          {credential.status === "creating" && <Icon name="sync" size={9} className="mr-0.5 animate-spin" />}
                          {credential.status === "blocked" && <Icon name="blocked" size={9} className="mr-0.5" />}
                          {credential.status}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-background/60 p-3 dark:border-[#5A3D26] dark:bg-[#4A2F1A]/60">
                      <p className="text-xs font-medium text-muted-foreground dark:text-[#C9B89F]">
                        No account created yet for {platformName ?? "this platform"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground dark:text-[#C9B89F]">
                        Aply will create one when you approve this application.
                      </p>
                    </div>
                  )}
                </div>

                <Separator className="bg-[#CFC5BE] dark:bg-[#5A3D26]" />

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground dark:text-[#C9B89F]">Created</p>
                    <p className="font-medium text-foreground dark:text-primary-foreground">
                      {relativeTime(app.createdAt)}
                    </p>
                  </div>
                  {app.submittedAt && (
                    <div>
                      <p className="text-muted-foreground dark:text-[#C9B89F]">Submitted</p>
                      <p className="font-medium text-foreground dark:text-primary-foreground">
                        {relativeTime(app.submittedAt)}
                      </p>
                    </div>
                  )}
                  {app.approvalChannel && (
                    <div>
                      <p className="text-muted-foreground dark:text-[#C9B89F]">Approved via</p>
                      <p className="font-medium capitalize text-foreground dark:text-primary-foreground">
                        {app.approvalChannel}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {app.status === "pending_approval" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleApprove}
                      disabled={busy !== null}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-accent hover:text-foreground"
                    >
                      {busy === "approve" ? (
                        <Icon name="sync" size={14} className="animate-spin" />
                      ) : (
                        <Icon name="check" size={14} />
                      )}
                      {t("approvals.approve")}
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                      className="border-border text-foreground hover:bg-background dark:border-[#5A3D26] dark:text-primary-foreground"
                    >
                      <a href={job.url} target="_blank" rel="noopener noreferrer">
                        <Icon name="link-external" size={14} />
                        View job
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
