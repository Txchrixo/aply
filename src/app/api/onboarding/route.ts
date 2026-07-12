/**
 * GET  /api/onboarding  · progress + draft fields for resume/settings
 * POST /api/onboarding  · save step progress or complete onboarding
 *
 * Source of truth is the DB (Setting + Resume). Cleared demo jobs/apps on complete
 * so the dashboard reflects the user's setup, not seed data.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  isSeedResume,
  isValidEmail,
  sanitizeOnboardingEmails,
} from "@/lib/onboarding";
import { deleteResumeFile, resumeHasFile } from "@/lib/resume-storage";

async function getOrCreateSettings() {
  let s = await db.setting.findUnique({ where: { id: "aply" } });
  if (!s) {
    s = await db.setting.create({
      data: {
        id: "aply",
        accountEmails: "[]",
        onboardingCompleted: false,
        onboardingStep: 0,
      },
    });
  }
  return s;
}

export async function GET() {
  const s = await getOrCreateSettings();
  const resume = await db.resume.findFirst({
    where: { isDefault: true },
    orderBy: { updatedAt: "desc" },
  });

  let accountEmails: string[] = [];
  try {
    accountEmails = JSON.parse(s.accountEmails);
  } catch {
    accountEmails = [];
  }

  // Never return seed demo content as user data (placeholder lives in the UI only)
  const rawResume = resume?.rawText ?? "";
  const resumeText = isSeedResume(rawResume) ? "" : rawResume;
  const emails = sanitizeOnboardingEmails(accountEmails);
  const notifyEmailRaw = s.notifyEmail ?? "";
  const notifyEmail =
    sanitizeOnboardingEmails(notifyEmailRaw ? [notifyEmailRaw] : [])[0] ?? "";
  const notifyWhatsapp =
    s.notifyWhatsapp === "+33 6 12 34 56 78" ? "" : s.notifyWhatsapp ?? "";

  const hasFile = resume ? resumeHasFile(resume) : false;

  return NextResponse.json({
    completed: s.onboardingCompleted,
    step: s.onboardingStep,
    resumeText,
    resumeId: resume?.id ?? null,
    resumeFileName: hasFile ? resume?.fileName ?? null : null,
    hasResumeFile: hasFile,
    accountEmails: emails,
    notifyEmail,
    notifyWhatsapp,
    firstName: s.firstName ?? "",
    lastName: s.lastName ?? "",
    preferCareerPage: s.preferCareerPage,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const s = await getOrCreateSettings();

    const data: Record<string, unknown> = {};

    // Explicit restart (signup) — handle before other writes
    if (body.reset === true) {
      const firstName =
        typeof body.firstName === "string" ? body.firstName.trim() : "";
      const lastName =
        typeof body.lastName === "string" ? body.lastName.trim() : "";
      // Back-compat: full name string → split
      let first = firstName;
      let last = lastName;
      if (!first && typeof body.displayName === "string") {
        const parts = body.displayName.trim().split(/\s+/).filter(Boolean);
        first = parts[0] ?? "";
        last = parts.slice(1).join(" ");
      }

      const updated = await db.setting.update({
        where: { id: s.id },
        data: {
          onboardingCompleted: false,
          onboardingStep: 0,
          accountEmails: "[]",
          notifyEmail: null,
          notifyWhatsapp: null,
          firstName: first || null,
          lastName: last || null,
        },
      });
      const allResumes = await db.resume.findMany();
      for (const r of allResumes) deleteResumeFile(r.filePath);
      await db.resume.deleteMany({});
      return NextResponse.json({
        ok: true,
        completed: false,
        step: 0,
        resumeText: "",
        resumeFileName: null,
        hasResumeFile: false,
        accountEmails: [],
        notifyEmail: "",
        notifyWhatsapp: "",
        firstName: updated.firstName ?? "",
        lastName: updated.lastName ?? "",
        preferCareerPage: updated.preferCareerPage,
      });
    }

    if (typeof body.firstName === "string") {
      data.firstName = body.firstName.trim() || null;
    }
    if (typeof body.lastName === "string") {
      data.lastName = body.lastName.trim() || null;
    }
    if (typeof body.step === "number") {
      data.onboardingStep = Math.max(0, Math.min(4, Math.floor(body.step)));
    }
    if (typeof body.notifyEmail === "string") {
      const email = body.notifyEmail.trim();
      data.notifyEmail = email && isValidEmail(email) ? email : null;
    }
    if (typeof body.notifyWhatsapp === "string") {
      const wa = body.notifyWhatsapp.trim();
      data.notifyWhatsapp = wa === "+33 6 12 34 56 78" ? null : wa || null;
    }
    if (typeof body.preferCareerPage === "boolean") data.preferCareerPage = body.preferCareerPage;
    if (Array.isArray(body.accountEmails)) {
      data.accountEmails = JSON.stringify(
        sanitizeOnboardingEmails(body.accountEmails.map((e: unknown) => String(e)))
      );
    }

    // Persist resume only if it's real user content (never seed placeholder)
    if (typeof body.resumeText === "string" && body.resumeText.trim()) {
      if (isSeedResume(body.resumeText)) {
        return NextResponse.json(
          { error: "Replace the example resume with your own before continuing" },
          { status: 400 }
        );
      }
      const existing = await db.resume.findFirst({ where: { isDefault: true } });
      if (existing) {
        await db.resume.update({
          where: { id: existing.id },
          data: {
            rawText: body.resumeText,
            label: body.resumeLabel ?? "Main resume",
            isDefault: true,
          },
        });
      } else {
        await db.resume.create({
          data: {
            label: body.resumeLabel ?? "Main resume",
            rawText: body.resumeText,
            isDefault: true,
            language: body.language ?? "en",
          },
        });
      }
    }

    const completing = body.complete === true;
    if (completing) {
      const resume = await db.resume.findFirst({ where: { isDefault: true } });
      const finalResume =
        typeof body.resumeText === "string" &&
        body.resumeText.trim() &&
        !isSeedResume(body.resumeText)
          ? body.resumeText
          : resume?.rawText;
      if (!finalResume || isSeedResume(finalResume)) {
        return NextResponse.json(
          { error: "Upload your resume before finishing" },
          { status: 400 }
        );
      }
      if (!resume || !resumeHasFile(resume)) {
        return NextResponse.json(
          { error: "Upload a PDF or DOCX resume file before finishing — text alone is not enough" },
          { status: 400 }
        );
      }

      const emails =
        typeof data.accountEmails === "string"
          ? JSON.parse(data.accountEmails as string)
          : sanitizeOnboardingEmails(JSON.parse(s.accountEmails));
      if (!emails.length) {
        return NextResponse.json(
          { error: "Add at least one account email before finishing" },
          { status: 400 }
        );
      }

      const notifyEmail =
        (data.notifyEmail as string | null | undefined) ?? s.notifyEmail;
      const notifyWhatsapp =
        (data.notifyWhatsapp as string | null | undefined) ?? s.notifyWhatsapp;
      if (!notifyEmail && !notifyWhatsapp) {
        return NextResponse.json(
          { error: "Add an approval email or WhatsApp number before finishing" },
          { status: 400 }
        );
      }

      data.onboardingCompleted = true;
      data.onboardingStep = 4;
      data.notifyChannel = notifyEmail || notifyWhatsapp ? "both" : "dashboard";

      await db.$transaction([
        db.notificationLog.deleteMany({}),
        db.application.deleteMany({}),
        db.jobOffer.deleteMany({}),
        db.pastApplication.deleteMany({}),
      ]);

      const defaultResume = await db.resume.findFirst({ where: { isDefault: true } });
      if (defaultResume?.id) {
        const extras = await db.resume.findMany({
          where: { id: { not: defaultResume.id } },
        });
        for (const r of extras) deleteResumeFile(r.filePath);
        await db.resume.deleteMany({ where: { id: { not: defaultResume.id } } });
      }
    }

    const updated = await db.setting.update({
      where: { id: s.id },
      data,
    });

    const resumeOut = await db.resume.findFirst({ where: { isDefault: true } });
    const outText = isSeedResume(resumeOut?.rawText) ? "" : resumeOut?.rawText ?? "";
    const hasFile = resumeOut ? resumeHasFile(resumeOut) : false;

    return NextResponse.json({
      ok: true,
      completed: updated.onboardingCompleted,
      step: updated.onboardingStep,
      resumeText: outText,
      resumeId: resumeOut?.id ?? null,
      resumeFileName: hasFile ? resumeOut?.fileName ?? null : null,
      hasResumeFile: hasFile,
      accountEmails: sanitizeOnboardingEmails(JSON.parse(updated.accountEmails)),
      notifyEmail: updated.notifyEmail ?? "",
      notifyWhatsapp: updated.notifyWhatsapp ?? "",
      preferCareerPage: updated.preferCareerPage,
    });
  } catch (err) {
    console.error("[/api/onboarding] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save onboarding" },
      { status: 500 }
    );
  }
}
