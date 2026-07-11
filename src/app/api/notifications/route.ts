/**
 * GET /api/notifications
 *   Returns the most recent notification log entries.
 * POST /api/notifications
 *   body: { applicationId, channel: 'email'|'whatsapp' }
 *   Simulates sending an approval-request notification (preview the summary).
 *   In production this would call SMTP / WhatsApp Cloud API.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Number(searchParams.get("limit") ?? "20"));
  const items = await db.notificationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json({
    items: items.map((n) => ({
      ...n,
      payload: n.payload ? JSON.parse(n.payload) : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { applicationId, channel } = body;
  if (!applicationId || !channel) {
    return NextResponse.json(
      { error: "applicationId and channel are required" },
      { status: 400 }
    );
  }

  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: { jobOffer: { include: { platform: true } } },
  });
  if (!application) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 }
    );
  }

  // Build a preview summary (what would be sent via email/WhatsApp)
  const summary = {
    channel,
    to:
      channel === "email"
        ? "alex.martin@example.com"
        : "+33 6 12 34 56 78",
    subject: `Aply · approval needed: ${application.jobOffer.title}`,
    body: [
      `Hi Alex,`,
      ``,
      `Aply prepared an application and is waiting for your green light.`,
      ``,
      `• Role: ${application.jobOffer.title}`,
      `• Company: ${application.jobOffer.company ?? "-"}`,
      `• Platform: ${application.jobOffer.platform.name}`,
      `• Location: ${application.jobOffer.location ?? "-"}`,
      `• Contract: ${application.jobOffer.contractType ?? "-"}`,
      `• Salary: ${application.jobOffer.salary ?? "-"}`,
      `• Language: ${application.language ?? "-"}`,
      `• Quality score: ${((application.qualityScore ?? 0) * 100).toFixed(0)}%`,
      ``,
      `Reply with APPROVE or REJECT to decide.`,
    ].join("\n"),
    coverLetterPreview: (application.coverLetter ?? "").slice(0, 280) + "…",
    jobUrl: application.jobOffer.url,
  };

  await db.notificationLog.create({
    data: {
      applicationId,
      channel,
      direction: "out",
      status: "sent",
      payload: JSON.stringify(summary),
    },
  });

  return NextResponse.json({ ok: true, preview: summary });
}
