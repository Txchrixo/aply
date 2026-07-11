/**
 * POST /api/answer-form
 * Body: { jobOfferId } or { jobTitle, company, jobDescription, language, platformId }
 *
 * Fetches the form field requirements for the platform, then uses GLM to
 * answer each question based on the user's resume. Returns the answers.
 *
 * This is the REAL implementation of "handle form variations":
 * - Each platform (Indeed, LinkedIn, Welcome to the Jungle, Upwork) asks
 *   different questions (education, experience, why this job, salary, etc.)
 * - GLM reads the resume and generates authentic answers
 * - For select fields, GLM picks the best option from the provided choices
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { answerFormQuestions, type FormQuestion, detectLanguage, type Language } from "@/lib/glm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let jobOfferId = body.jobOfferId as string | undefined;
    let platformId = body.platformId as string | undefined;
    let jobTitle = body.jobTitle as string | undefined;
    let company = body.company as string | undefined;
    let jobDescription = body.jobDescription as string | undefined;
    let language = body.language as Language | undefined;

    // If jobOfferId provided, load from DB
    if (jobOfferId) {
      const offer = await db.jobOffer.findUnique({
        where: { id: jobOfferId },
        include: { platform: true },
      });
      if (!offer) {
        return NextResponse.json({ error: "Job offer not found" }, { status: 404 });
      }
      jobTitle = offer.title;
      company = offer.company ?? undefined;
      jobDescription = offer.description ?? offer.title;
      platformId = offer.platformId ?? undefined;
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

    // Get form field requirements for this platform
    let questions: FormQuestion[] = [];
    if (platformId) {
      const reqs = await db.formFieldRequirement.findMany({
        where: { platformId },
        orderBy: { isRequired: "desc" },
      });
      questions = reqs
        .filter((r) => r.fieldKey !== "resume" && r.fieldKey !== "cover_letter") // these are handled separately
        .map((r) => ({
          fieldKey: r.fieldKey,
          fieldLabel: r.fieldLabel,
          fieldType: r.fieldType,
          isRequired: r.isRequired,
          options: r.options ? JSON.parse(r.options) : null,
          placeholder: r.placeholder,
        }));
    }

    if (questions.length === 0) {
      return NextResponse.json({
        answers: [],
        message: "No custom form questions found for this platform",
      });
    }

    // Get the user's default resume
    const resume = await db.resume.findFirst({ where: { isDefault: true } });
    if (!resume) {
      return NextResponse.json(
        { error: "No default resume found. Please upload your resume first." },
        { status: 400 }
      );
    }

    // Use GLM to answer the questions
    const answers = await answerFormQuestions({
      questions,
      resumeText: resume.rawText,
      jobTitle,
      company,
      jobDescription,
      language,
    });

    return NextResponse.json({
      answers,
      questionCount: questions.length,
      language,
    });
  } catch (err) {
    console.error("[/api/answer-form] error:", err);
    const message = err instanceof Error ? err.message : "Failed to answer questions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
