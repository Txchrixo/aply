/**
 * POST /api/applications/[id]/approve
 * Approves the draft and runs the real browser apply (Playwright session).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applyApplication } from "@/lib/browser/apply";

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

  const existing = await db.application.findUnique({
    where: { id },
    include: { jobOffer: { include: { platform: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  await db.application.update({
    where: { id },
    data: {
      status: "approved",
      approvedAt: new Date(),
      approvalChannel: channel,
      errorMessage: null,
    },
  });

  const applyResult = await applyApplication(id, { confirmSubmit: true });

  if (applyResult.captcha) {
    const updated = await db.application.update({
      where: { id },
      data: {
        status: "pending_approval",
        errorMessage: applyResult.error ?? "CAPTCHA — solve in browser then approve again",
      },
      include: { jobOffer: { include: { platform: true } } },
    });
    await db.notificationLog.create({
      data: {
        applicationId: id,
        channel,
        direction: "out",
        status: "waiting_captcha",
        payload: JSON.stringify({ at: new Date().toISOString(), applyResult }),
      },
    });
    return NextResponse.json({
      ...updated,
      formFields: updated.formFields ? JSON.parse(updated.formFields) : null,
      apply: applyResult,
    });
  }

  if (!applyResult.ok || !applyResult.submitted) {
    const updated = await db.application.update({
      where: { id },
      data: {
        status: applyResult.ok && !applyResult.submitted ? "approved" : "failed",
        errorMessage:
          applyResult.error ??
          applyResult.message ??
          "Apply did not complete submit",
      },
      include: { jobOffer: { include: { platform: true } } },
    });
    await db.notificationLog.create({
      data: {
        applicationId: id,
        channel,
        direction: "out",
        status: "apply_incomplete",
        payload: JSON.stringify({ at: new Date().toISOString(), applyResult }),
      },
    });
    return NextResponse.json(
      {
        ...updated,
        formFields: updated.formFields ? JSON.parse(updated.formFields) : null,
        apply: applyResult,
      },
      { status: applyResult.ok ? 200 : 500 }
    );
  }

  const updated = await db.application.update({
    where: { id },
    data: {
      status: "submitted",
      submittedAt: new Date(),
      submittedVia: existing.jobOffer.applicationSource ?? "career_page",
      errorMessage: null,
    },
    include: { jobOffer: { include: { platform: true } } },
  });

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
      payload: JSON.stringify({
        at: new Date().toISOString(),
        apply: applyResult,
      }),
    },
  });

  return NextResponse.json({
    ...updated,
    formFields: updated.formFields ? JSON.parse(updated.formFields) : null,
    apply: applyResult,
  });
}
