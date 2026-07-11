/**
 * GET /api/past-applications
 *   Returns the user's past applications (style training data).
 * POST /api/past-applications
 *   body: { jobTitle, company?, coverLetter, language, outcome? }
 *   Adds a new past application to train Aply's voice.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const items = await db.pastApplication.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.jobTitle || !body?.coverLetter) {
    return NextResponse.json(
      { error: "jobTitle and coverLetter are required" },
      { status: 400 }
    );
  }
  const created = await db.pastApplication.create({
    data: {
      jobTitle: body.jobTitle,
      company: body.company ?? null,
      coverLetter: body.coverLetter,
      language: body.language ?? "en",
      outcome: body.outcome ?? "manual",
      usedAsExample: body.usedAsExample ?? true,
    },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.pastApplication.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
