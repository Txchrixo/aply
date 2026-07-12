/**
 * GET /api/resume
 *   Returns resumes (raw text + structured + file metadata).
 * POST /api/resume
 *   body: { rawText, label?, language?, isDefault? }
 *   Creates a resume (text only — use /api/resume/upload to keep the file).
 * PATCH /api/resume
 *   body: { id, rawText?, label?, … }
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteResumeFile, resumeHasFile } from "@/lib/resume-storage";

function mapResume(r: {
  id: string;
  label: string;
  rawText: string;
  structured: string | null;
  language: string;
  isDefault: boolean;
  fileName: string | null;
  fileMime: string | null;
  filePath: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: r.id,
    label: r.label,
    rawText: r.rawText,
    structured: r.structured ? JSON.parse(r.structured) : null,
    language: r.language,
    isDefault: r.isDefault,
    fileName: r.fileName,
    fileMime: r.fileMime,
    hasFile: resumeHasFile(r),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function GET() {
  const resumes = await db.resume.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({
    items: resumes.map(mapResume),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.rawText) {
    return NextResponse.json({ error: "rawText is required" }, { status: 400 });
  }

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
  return NextResponse.json(mapResume(created), { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (!body?.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (body.isDefault) {
    await db.resume.updateMany({ data: { isDefault: false } });
  }

  if (body.clearFile === true) {
    const current = await db.resume.findUnique({ where: { id: body.id } });
    if (current?.filePath) deleteResumeFile(current.filePath);
  }

  const updated = await db.resume.update({
    where: { id: body.id },
    data: {
      ...(body.rawText ? { rawText: body.rawText } : {}),
      ...(body.label ? { label: body.label } : {}),
      ...(body.language ? { language: body.language } : {}),
      ...(typeof body.isDefault === "boolean" ? { isDefault: body.isDefault } : {}),
      ...(body.structured ? { structured: JSON.stringify(body.structured) } : {}),
      ...(body.clearFile === true
        ? { fileName: null, fileMime: null, filePath: null }
        : {}),
    },
  });
  return NextResponse.json(mapResume(updated));
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const current = await db.resume.findUnique({ where: { id } });
  if (current?.filePath) deleteResumeFile(current.filePath);
  await db.resume.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
