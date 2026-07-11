/**
 * POST /api/applications/[id]/reject
 * Marks an application as rejected/skipped by the user.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let reason: string | undefined;
  try {
    const body = await req.json();
    reason = body?.reason;
  } catch {
    /* no body */
  }

  const updated = await db.application.update({
    where: { id },
    data: { status: "rejected" },
    include: { jobOffer: { include: { platform: true } } },
  });

  await db.jobOffer.update({
    where: { id: updated.jobOfferId },
    data: { status: "skipped" },
  });

  await db.notificationLog.create({
    data: {
      applicationId: id,
      channel: "dashboard",
      direction: "in",
      status: "rejected",
      payload: JSON.stringify({ reason, at: new Date().toISOString() }),
    },
  });

  return NextResponse.json({
    ...updated,
    formFields: updated.formFields ? JSON.parse(updated.formFields) : null,
  });
}
