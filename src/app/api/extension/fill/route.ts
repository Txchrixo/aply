/**
 * POST /api/extension/fill
 * Body: { fields: DetectedField[], url?: string }
 *
 * Maps detected form fields to values from:
 *  - default resume (structured + raw)
 *  - settings (account emails)
 *  - matching pending application (cover letter) by URL when possible
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireExtensionAuth } from "@/lib/extension-auth";
import { readResumeFile, resumeHasFile } from "@/lib/resume-storage";

type DetectedField = {
  selector: string;
  name?: string;
  label?: string;
  type?: string;
  fieldKey?: string;
  required?: boolean;
  options?: string[] | null;
};

type FillValue = {
  selector: string;
  value: string;
  fieldKey?: string;
  file?: {
    fileName: string;
    mimeType: string;
    base64: string;
  };
};

function pickStructured(resume: { structured: string | null; rawText: string }) {
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
  return {
    fullName: name || "",
    firstName: (structured.firstName as string) || contact.firstName || parts[0] || "",
    lastName: (structured.lastName as string) || contact.lastName || parts.slice(1).join(" ") || "",
    email: (structured.email as string) || contact.email || "",
    phone: (structured.phone as string) || contact.phone || "",
    linkedin: (structured.linkedin as string) || contact.linkedin || "",
    github: (structured.github as string) || contact.github || "",
    portfolio: (structured.portfolio as string) || (structured.website as string) || contact.website || "",
    location: (structured.location as string) || contact.location || "",
    rawText: resume.rawText,
  };
}

function matchOption(options: string[] | null | undefined, preferred: string): string {
  if (!options?.length) return preferred;
  const lower = preferred.toLowerCase();
  const exact = options.find((o) => o.toLowerCase() === lower);
  if (exact) return exact;
  const partial = options.find((o) => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase()));
  return partial ?? options[0] ?? preferred;
}

export async function POST(req: NextRequest) {
  try {
    requireExtensionAuth(req);

    const body = await req.json();
    const fields = (body?.fields ?? []) as DetectedField[];
    const url = String(body?.url ?? "").trim();

    if (!Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: "fields array is required" }, { status: 400 });
    }

    const [resume, settings, matchingApp] = await Promise.all([
      db.resume.findFirst({ where: { isDefault: true } }),
      db.setting.findUnique({ where: { id: "aply" } }),
      url
        ? db.application.findFirst({
            where: {
              status: { in: ["pending_approval", "draft", "approved"] },
              jobOffer: { url },
            },
            orderBy: { createdAt: "desc" },
            include: { jobOffer: true },
          })
        : Promise.resolve(null),
    ]);

    const profile = resume
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
        };

    let accountEmail = profile.email;
    if (!accountEmail && settings?.accountEmails) {
      try {
        const emails = JSON.parse(settings.accountEmails) as string[];
        accountEmail = emails[0] ?? "";
      } catch {
        /* ignore */
      }
    }

    const coverLetter = matchingApp?.coverLetter ?? "";

    let resumeFilePayload: FillValue["file"] | undefined;
    if (resume && resumeHasFile(resume)) {
      const buf = readResumeFile(resume.filePath);
      if (buf && buf.length <= 8 * 1024 * 1024) {
        resumeFilePayload = {
          fileName: resume.fileName || "resume.pdf",
          mimeType: resume.fileMime || "application/pdf",
          base64: buf.toString("base64"),
        };
      }
    }

    const values: FillValue[] = [];
    for (const field of fields) {
      const key = field.fieldKey || "unknown";
      let value = "";
      const isFileField = field.type === "file" || key === "resume";

      if (isFileField) {
        if (resumeFilePayload) {
          values.push({
            selector: field.selector,
            value: resumeFilePayload.fileName,
            fieldKey: key === "unknown" ? "resume" : key,
            file: resumeFilePayload,
          });
        }
        continue;
      }

      switch (key) {
        case "full_name":
          value = profile.fullName || `${profile.firstName} ${profile.lastName}`.trim();
          break;
        case "first_name":
          value = profile.firstName;
          break;
        case "last_name":
          value = profile.lastName;
          break;
        case "email":
          value = accountEmail;
          break;
        case "phone":
          value = profile.phone;
          break;
        case "linkedin":
          value = profile.linkedin;
          break;
        case "github":
          value = profile.github;
          break;
        case "portfolio":
          value = profile.portfolio;
          break;
        case "cover_letter":
        case "why":
          value = coverLetter;
          break;
        case "location":
          value = profile.location;
          break;
        case "experience":
        case "education":
          value = profile.rawText.slice(0, 500);
          break;
        case "work_auth":
          value = matchOption(field.options, "Yes");
          break;
        case "resume":
          // Handled above via file payload
          continue;
        default: {
          // Heuristic for unlabeled fields
          const blob = `${field.label ?? ""} ${field.name ?? ""}`.toLowerCase();
          if (/email|mail/.test(blob)) value = accountEmail;
          else if (/phone|tel|mobile/.test(blob)) value = profile.phone;
          else if (/first/.test(blob)) value = profile.firstName;
          else if (/last|surname|nom(?! complet)/.test(blob)) value = profile.lastName;
          else if (/name|nom/.test(blob)) value = profile.fullName || `${profile.firstName} ${profile.lastName}`.trim();
          else if (/cover|motivation|letter|anschreiben/.test(blob)) value = coverLetter;
          else if (/linkedin/.test(blob)) value = profile.linkedin;
          else if (/github/.test(blob)) value = profile.github;
          else if (/website|portfolio|url/.test(blob)) value = profile.portfolio;
          break;
        }
      }

      if (!value) continue;
      if (field.type === "select" || field.options?.length) {
        value = matchOption(field.options, value);
      }
      values.push({ selector: field.selector, value, fieldKey: key });
    }

    return NextResponse.json({
      ok: true,
      values,
      matchedApplicationId: matchingApp?.id ?? null,
      filledCount: values.length,
      profileReady: Boolean(resume),
      hasResumeFile: Boolean(resumeFilePayload),
    });
  } catch (err) {
    console.error("[/api/extension/fill] error:", err);
    const message = err instanceof Error ? err.message : "Fill failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
