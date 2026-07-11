/**
 * GET /api/resume
 *   Returns the default resume (raw text + structured).
 * POST /api/resume
 *   body: { rawText, label?, language?, isDefault? }
 *   Creates/updates a resume.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const resumes = await db.resume.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({
    items: resumes.map((r) => ({
      ...r,
      structured: r.structured ? JSON.parse(r.structured) : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.rawText) {
    return NextResponse.json({ error: "rawText is required" }, { status: 400 });
  }

  // If isDefault, unset others
  if (body.isDefault) {
    await db.resume.updateMany({ data: { isDefault: false } });
  }

  const created = await db.resume.create({
    data: {
      label: body.label ?? "Resume",
      rawText: body.rawText,
      structured: body.structured ? JSON.stringify(body.structured) : null,
      language: body.language ?? "en",
      isDefault: body.isDefault ?? true,
    },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (!body?.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (body.isDefault) {
    await db.resume.updateMany({ data: { isDefault: false } });
  }
  const updated = await db.resume.update({
    where: { id: body.id },
    data: {
      ...(body.rawText ? { rawText: body.rawText } : {}),
      ...(body.label ? { label: body.label } : {}),
      ...(body.language ? { language: body.language } : {}),
      ...(typeof body.isDefault === "boolean" ? { isDefault: body.isDefault } : {}),
      ...(body.structured ? { structured: JSON.stringify(body.structured) } : {}),
    },
  });
  return NextResponse.json(updated);
}
