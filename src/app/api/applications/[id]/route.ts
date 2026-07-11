/**
 * GET /api/applications/[id]
 * Returns a single application with its job offer + platform.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const app = await db.application.findUnique({
    where: { id },
    include: { jobOffer: { include: { platform: true } } },
  });
  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    ...app,
    formFields: app.formFields ? JSON.parse(app.formFields) : null,
  });
}
