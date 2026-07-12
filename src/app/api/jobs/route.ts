/**
 * GET /api/jobs
 *   ?status=new|pending_approval|applied|...&page=1&pageSize=20
 * Returns detected job offers with their platform.
 *
 * POST /api/jobs
 *   Extension capture: { url, title?, rawHtml|pageText, capturedAt? }
 *   Creates a JobOffer, optionally drafts a cover letter + pending application.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractJobFields, generateCoverLetter, detectLanguage, type Language } from "@/lib/glm";
import { requireExtensionAuth } from "@/lib/extension-auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const source = searchParams.get("source"); // career_page | job_board
  const q = (searchParams.get("q") ?? "").trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    96,
    Math.max(1, Number(searchParams.get("pageSize") ?? "20"))
  );

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (source === "career_page" || source === "job_board") {
    where.applicationSource = source;
  }
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { company: { contains: q } },
      { location: { contains: q } },
      { platform: { name: { contains: q } } },
    ];
  }

  const [total, items] = await Promise.all([
    db.jobOffer.count({ where }),
    db.jobOffer.findMany({
      where,
      orderBy: { detectedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        platform: true,
        companyRecord: {
          select: {
            id: true,
            name: true,
            website: true,
            careerPages: {
              where: { enabled: true },
              select: { url: true },
              take: 1,
            },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  });
}

export async function POST(req: NextRequest) {
  try {
    // Prefer authenticated extension calls; still allow local unauthenticated for dev.
    requireExtensionAuth(req);

    const body = await req.json();
    const url = String(body?.url ?? "").trim();
    const titleHint = String(body?.title ?? "").trim();
    const pageText = String(body?.rawHtml ?? body?.pageText ?? "").trim();

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const existing = await db.jobOffer.findFirst({
      where: { url },
      include: { applications: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (existing) {
      return NextResponse.json({
        ok: true,
        id: existing.id,
        title: existing.title,
        company: existing.company,
        status: existing.status,
        applicationId: existing.applications[0]?.id ?? null,
        duplicate: true,
      });
    }

    let extracted: {
      title: string;
      company?: string;
      location?: string;
      description: string;
      contractType?: string;
      language: Language;
      detectedSkills: string[];
    } | null = null;

    if (pageText.length > 40) {
      try {
        extracted = await extractJobFields(pageText.slice(0, 14000));
      } catch (err) {
        console.warn("[/api/jobs POST] extractJobFields failed, using fallback:", err);
      }
    }

    const title = extracted?.title || titleHint || "Captured job offer";
    const description =
      extracted?.description ||
      pageText.slice(0, 4000) ||
      title;
    const language =
      extracted?.language ||
      (await detectLanguage(`${title} ${description}`).catch(() => "en" as Language));

    const offer = await db.jobOffer.create({
      data: {
        title,
        company: extracted?.company ?? null,
        location: extracted?.location ?? null,
        url,
        description,
        contractType: extracted?.contractType ?? null,
        language,
        status: "new",
        importProgress: 100,
        importStep: "ready",
        applicationSource: "job_board",
      },
    });

    let applicationId: string | null = null;
    let qualityScore: number | null = null;

    const resume = await db.resume.findFirst({ where: { isDefault: true } });
    if (resume) {
      try {
        const pastApps = await db.pastApplication.findMany({
          where: { usedAsExample: true, language },
          take: 3,
          orderBy: { createdAt: "desc" },
        });
        const result = await generateCoverLetter({
          jobTitle: title,
          company: extracted?.company,
          jobDescription: description,
          resumeText: resume.rawText,
          language,
          pastExamples: pastApps.map((p) => p.coverLetter),
          tone: "warm",
        });
        const application = await db.application.create({
          data: {
            jobOfferId: offer.id,
            resumeId: resume.id,
            coverLetter: result.coverLetter,
            language,
            qualityScore: result.qualityScore,
            status: "pending_approval",
          },
        });
        applicationId = application.id;
        qualityScore = result.qualityScore;
        await db.jobOffer.update({
          where: { id: offer.id },
          data: { status: "pending_approval" },
        });
      } catch (err) {
        console.warn("[/api/jobs POST] draft generation skipped:", err);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        id: offer.id,
        title: offer.title,
        company: offer.company,
        status: applicationId ? "pending_approval" : offer.status,
        applicationId,
        qualityScore,
        duplicate: false,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[/api/jobs POST] error:", err);
    const message = err instanceof Error ? err.message : "Capture failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
