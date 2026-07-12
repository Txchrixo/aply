/**
 * GET /api/resume/file?id=optional
 * Serves the stored original resume file (default resume if id omitted).
 * Used by the browser agent and Chrome extension for form file inputs.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readResumeFile } from "@/lib/resume-storage";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const asJson = req.nextUrl.searchParams.get("format") === "json";

  const resume = id
    ? await db.resume.findUnique({ where: { id } })
    : await db.resume.findFirst({ where: { isDefault: true } });

  if (!resume?.filePath) {
    return NextResponse.json(
      { error: "No resume file stored. Upload a PDF/DOCX in onboarding or Settings." },
      { status: 404 }
    );
  }

  const buffer = readResumeFile(resume.filePath);
  if (!buffer) {
    return NextResponse.json(
      { error: "Resume file missing on disk — re-upload your resume" },
      { status: 404 }
    );
  }

  const fileName = resume.fileName || "resume.pdf";
  const mime = resume.fileMime || "application/octet-stream";
  const wantDownload = req.nextUrl.searchParams.get("download") === "1";
  // Default inline so the dashboard can embed PDFs; ?download=1 forces save-as.
  const disposition = wantDownload ? "attachment" : "inline";

  if (asJson) {
    return NextResponse.json({
      id: resume.id,
      fileName,
      mimeType: mime,
      base64: buffer.toString("base64"),
      size: buffer.length,
    });
  }

  const safeName = fileName.replace(/"/g, "");
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `${disposition}; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
