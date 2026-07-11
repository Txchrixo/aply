/**
 * POST /api/applications/[id]/approve
 * Marks an application as approved by the user and (simulated) submitted.
 * Logs a notification entry and returns the updated application.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let channel = "dashboard";
  try {
    const body = await req.json();
    if (body?.channel) channel = body.channel;
  } catch {
    /* no body · dashboard approval */
  }

  const updated = await db.application.update({
    where: { id },
    data: {
      status: "submitted",
      approvedAt: new Date(),
      submittedAt: new Date(),
      approvalChannel: channel,
    },
    include: { jobOffer: { include: { platform: true } } },
  });

  // bump the job offer status too
  await db.jobOffer.update({
    where: { id: updated.jobOfferId },
    data: { status: "applied" },
  });

  await db.notificationLog.create({
    data: {
      applicationId: id,
      channel,
      direction: "in",
      status: "approved",
      payload: JSON.stringify({ at: new Date().toISOString() }),
    },
  });

  return NextResponse.json({
    ...updated,
    formFields: updated.formFields ? JSON.parse(updated.formFields) : null,
  });
}
