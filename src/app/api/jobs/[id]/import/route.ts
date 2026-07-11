/**
 * POST /api/jobs/[id]/import
 * Runs the real import pipeline for a job offer:
 * 1. detecting_fields - check form requirements for the platform
 * 2. generating_letter - determine application source (career page vs job board)
 * 3. answering_questions - detect cross-references
 * 4. ready
 *
 * Returns the final status + source determination + cross-ref count.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runImportPipeline, determineApplicationSource, detectAndCreateCrossReferences } from "@/lib/application-strategy";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const offer = await db.jobOffer.findUnique({
    where: { id },
    include: { platform: true },
  });

  if (!offer) {
    return NextResponse.json({ error: "Job offer not found" }, { status: 404 });
  }

  try {
    // Run the pipeline
    await runImportPipeline(id);

    // Get the results
    const sourceResult = await determineApplicationSource(id);
    const xrefCount = await detectAndCreateCrossReferences(id);

    const updated = await db.jobOffer.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        importProgress: true,
        importStep: true,
        applicationSource: true,
      },
    });

    return NextResponse.json({
      ok: true,
      offer: updated,
      source: sourceResult,
      crossReferencesCreated: xrefCount,
    });
  } catch (err) {
    console.error("[/api/jobs/[id]/import] error:", err);
    // Mark as failed
    await db.jobOffer.update({
      where: { id },
      data: {
        status: "new",
        importProgress: 100,
        importStep: "ready",
      },
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 }
    );
  }
}
