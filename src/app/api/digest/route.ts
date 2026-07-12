/**
 * GET /api/digest
 * Generates a weekly digest summary:
 *   - total scans this week
 *   - new offers detected
 *   - applications submitted
 *   - response rate
 *   - top platforms scanned
 *   - pending approvals count
 *   - average quality score
 *   - formatted email preview (subject + body)
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { greetingLine } from "@/lib/user-identity";
import { resolveUserGreetingName } from "@/lib/user-identity-server";

export async function GET() {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const userName = await resolveUserGreetingName();

  // Applications created this week
  const weekApplications = await db.application.findMany({
    where: { createdAt: { gte: weekAgo } },
    select: {
      id: true,
      status: true,
      qualityScore: true,
      language: true,
      createdAt: true,
      submittedAt: true,
      jobOffer: {
        select: {
          id: true,
          title: true,
          company: true,
          platform: { select: { name: true } },
        },
      },
    },
  });

  // Job offers detected this week
  const weekOffers = await db.jobOffer.count({
    where: { detectedAt: { gte: weekAgo } },
  });

  // Notification logs (scans) this week
  const weekScans = await db.notificationLog.count({
    where: {
      createdAt: { gte: weekAgo },
      channel: "dashboard",
      direction: "out",
    },
  });

  // Pending approvals
  const pendingCount = await db.application.count({
    where: { status: "pending_approval" },
  });

  // Submitted this week
  const submittedThisWeek = weekApplications.filter(
    (a) => a.status === "submitted"
  );
  // Rejected this week
  const rejectedThisWeek = weekApplications.filter(
    (a) => a.status === "rejected"
  );

  // Average quality
  const scoredApps = weekApplications.filter((a) => a.qualityScore != null);
  const avgQuality =
    scoredApps.length > 0
      ? scoredApps.reduce((s, a) => s + (a.qualityScore ?? 0), 0) /
        scoredApps.length
      : 0;

  // Response rate
  const responseRate =
    submittedThisWeek.length > 0
      ? (submittedThisWeek.length - rejectedThisWeek.length) /
        submittedThisWeek.length
      : 0;

  // Top platforms this week
  const platformMap = new Map<string, number>();
  for (const a of weekApplications) {
    const name = a.jobOffer?.platform?.name ?? "Unknown";
    platformMap.set(name, (platformMap.get(name) ?? 0) + 1);
  }
  const topPlatforms = Array.from(platformMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Build email preview
  const subject = `Aply · your weekly digest (${weekScans} scans, ${submittedThisWeek.length} submitted)`;
  const body = [
    greetingLine(userName),
    ``,
    `Here's your Aply weekly summary:`,
    ``,
    `📊 SCANS & DETECTION`,
    `• Scans run this week: ${weekScans}`,
    `• New offers detected: ${weekOffers}`,
    `• Applications prepared: ${weekApplications.length}`,
    ``,
    `✅ APPLICATIONS`,
    `• Submitted: ${submittedThisWeek.length}`,
    `• Rejected: ${rejectedThisWeek.length}`,
    `• Response rate: ${Math.round(responseRate * 100)}%`,
    `• Pending your approval: ${pendingCount}`,
    ``,
    `⭐ QUALITY`,
    `• Average draft quality: ${Math.round(avgQuality * 100)}%`,
    ``,
    topPlatforms.length > 0
      ? `🏆 TOP PLATFORMS THIS WEEK\n${topPlatforms
          .map((p, i) => `   ${i + 1}. ${p.name} (${p.count})`)
          .join("\n")}`
      : "",
    pendingCount > 0
      ? `\n🔔 ${pendingCount} application${pendingCount > 1 ? "s" : ""} waiting for your approval. Open Aply to review.`
      : "",
    ``,
    `- Aply`,
    ``,
    `You're receiving this because weekly digests are enabled in your settings.`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  return NextResponse.json({
    period: {
      from: weekAgo.toISOString(),
      to: now.toISOString(),
    },
    stats: {
      scans: weekScans,
      newOffers: weekOffers,
      applicationsPrepared: weekApplications.length,
      submitted: submittedThisWeek.length,
      rejected: rejectedThisWeek.length,
      pending: pendingCount,
      avgQuality: Math.round(avgQuality * 100) / 100,
      responseRate: Math.round(responseRate * 100) / 100,
    },
    topPlatforms,
    email: {
      subject,
      body,
    },
  });
}
