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
import { greetingLine } from "@/lib/user-identity";
import { resolveUserGreetingName } from "@/lib/user-identity-server";

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

  const settings = await db.setting.findUnique({ where: { id: "aply" } });
  const userName = await resolveUserGreetingName();

  let to = channel === "whatsapp" ? "+00 000 000 000" : "you@example.com";
  if (channel === "email") {
    if (settings?.notifyEmail?.trim()) {
      to = settings.notifyEmail.trim();
    } else {
      try {
        const emails = JSON.parse(settings?.accountEmails ?? "[]") as string[];
        if (emails[0]?.trim()) to = emails[0].trim();
      } catch {
        /* keep fallback */
      }
    }
  } else if (settings?.notifyWhatsapp?.trim()) {
    to = settings.notifyWhatsapp.trim();
  }

  // Build a preview summary (what would be sent via email/WhatsApp)
  const summary = {
    channel,
    to,
    subject: `Aply · approval needed: ${application.jobOffer.title}`,
    body: [
      greetingLine(userName),
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
