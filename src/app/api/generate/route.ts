/**
 * POST /api/generate
 * Body: { jobOfferId }
 *   OR { jobTitle, company, jobDescription, language }
 *
 * Generates an authentic cover letter via GLM using:
 *  - the user's default resume
 *  - past applications as style references (few-shot)
 *  - the job offer description
 *
 * Returns: { coverLetter, detectedSkills, qualityScore, applicationId }
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  generateCoverLetter,
  detectLanguage,
  type Language,
} from "@/lib/glm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let jobTitle = body.jobTitle;
    let company = body.company;
    let jobDescription = body.jobDescription;
    let language: Language | undefined = body.language as Language;
    let jobOfferId = body.jobOfferId as string | undefined;

    // If a jobOfferId is provided, load from DB
    if (jobOfferId) {
      const offer = await db.jobOffer.findUnique({
        where: { id: jobOfferId },
        include: { platform: true },
      });
      if (!offer) {
        return NextResponse.json(
          { error: "Job offer not found" },
          { status: 404 }
        );
      }
      jobTitle = offer.title;
      company = offer.company ?? undefined;
      jobDescription =
        offer.description ?? `${offer.title} at ${offer.company ?? ""}`;
      language = (offer.language as Language) ?? language;
    }

    if (!jobTitle || !jobDescription) {
      return NextResponse.json(
        { error: "jobTitle and jobDescription (or jobOfferId) are required" },
        { status: 400 }
      );
    }

    if (!language) {
      language = await detectLanguage(jobDescription);
    }

    const resume = await db.resume.findFirst({
      where: { isDefault: true },
    });
    if (!resume) {
      return NextResponse.json(
        { error: "No default resume found. Please upload your resume first." },
        { status: 400 }
      );
    }

    const pastApps = await db.pastApplication.findMany({
      where: { usedAsExample: true, language },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    const result = await generateCoverLetter({
      jobTitle,
      company,
      jobDescription,
      resumeText: resume.rawText,
      language,
      pastExamples: pastApps.map((p) => p.coverLetter),
      tone: "warm",
    });

    // Persist as a draft application (or update existing)
    let application;
    if (jobOfferId) {
      const existing = await db.application.findFirst({
        where: { jobOfferId },
      });
      if (existing) {
        application = await db.application.update({
          where: { id: existing.id },
          data: {
            coverLetter: result.coverLetter,
            language,
            resumeId: resume.id,
            qualityScore: result.qualityScore,
            status: existing.status === "draft" ? "pending_approval" : existing.status,
          },
        });
      } else {
        application = await db.application.create({
          data: {
            jobOfferId,
            resumeId: resume.id,
            coverLetter: result.coverLetter,
            language,
            qualityScore: result.qualityScore,
            status: "pending_approval",
          },
        });
      }
      // bump offer status
      await db.jobOffer.update({
        where: { id: jobOfferId },
        data: { status: "pending_approval" },
      });
    }

    return NextResponse.json({
      coverLetter: result.coverLetter,
      detectedSkills: result.detectedSkills,
      qualityScore: result.qualityScore,
      language,
      applicationId: application?.id,
    });
  } catch (err) {
    console.error("[/api/generate] error:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
