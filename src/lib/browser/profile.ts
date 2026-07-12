/**
 * Build applicant profile from default resume + settings (+ optional cover letter).
 */
import { db } from "@/lib/db";
import type { ApplicantProfile } from "@/lib/browser/types";
import { resumeHasFile } from "@/lib/resume-storage";

function pickStructured(resume: {
  structured: string | null;
  rawText: string;
  filePath: string | null;
  fileName: string | null;
  fileMime: string | null;
}) {
  let structured: Record<string, unknown> = {};
  if (resume.structured) {
    try {
      structured = JSON.parse(resume.structured) as Record<string, unknown>;
    } catch {
      structured = {};
    }
  }
  const contact = (structured.contact as Record<string, string> | undefined) ?? {};
  const name =
    (structured.fullName as string) ||
    (structured.name as string) ||
    contact.name ||
    contact.fullName ||
    "";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const hasFile = resumeHasFile(resume);
  return {
    fullName: name || "",
    firstName: (structured.firstName as string) || contact.firstName || parts[0] || "",
    lastName:
      (structured.lastName as string) ||
      contact.lastName ||
      parts.slice(1).join(" ") ||
      "",
    email: (structured.email as string) || contact.email || "",
    phone: (structured.phone as string) || contact.phone || "",
    linkedin: (structured.linkedin as string) || contact.linkedin || "",
    github: (structured.github as string) || contact.github || "",
    portfolio:
      (structured.portfolio as string) ||
      (structured.website as string) ||
      contact.website ||
      "",
    location: (structured.location as string) || contact.location || "",
    rawText: resume.rawText,
    resumeFilePath: hasFile ? resume.filePath : null,
    resumeFileName: hasFile ? resume.fileName : null,
    resumeFileMime: hasFile ? resume.fileMime : null,
  };
}

export async function loadApplicantProfile(
  coverLetter = ""
): Promise<ApplicantProfile> {
  const [resume, settings] = await Promise.all([
    db.resume.findFirst({ where: { isDefault: true } }),
    db.setting.findUnique({ where: { id: "aply" } }),
  ]);

  const base = resume
    ? pickStructured(resume)
    : {
        fullName: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        linkedin: "",
        github: "",
        portfolio: "",
        location: "",
        rawText: "",
        resumeFilePath: null,
        resumeFileName: null,
        resumeFileMime: null,
      };

  let email = base.email;
  if (!email && settings?.accountEmails) {
    try {
      const emails = JSON.parse(settings.accountEmails) as string[];
      email = emails[0] ?? "";
    } catch {
      /* ignore */
    }
  }

  return {
    ...base,
    email,
    coverLetter,
  };
}
