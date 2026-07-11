/**
 * GET /api/stats
 * Returns aggregated stats for the dashboard hero.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [
    platformsTotal,
    platformsEnabled,
    pendingApprovals,
    preparedDrafts,
    newOffers,
    submittedTotal,
    rejectedTotal,
    pastApps,
  ] = await Promise.all([
    db.platform.count(),
    db.platform.count({ where: { enabled: true } }),
    db.application.count({ where: { status: "pending_approval" } }),
    db.application.count({ where: { status: "draft" } }),
    db.jobOffer.count({ where: { status: "new" } }),
    db.application.count({ where: { status: "submitted" } }),
    db.application.count({ where: { status: "rejected" } }),
    db.pastApplication.count(),
  ]);

  const settings = await db.setting.findUnique({ where: { id: "aply" } });

  return NextResponse.json({
    platformsTotal,
    platformsEnabled,
    pendingApprovals,
    preparedDrafts,
    newOffers,
    submittedTotal,
    rejectedTotal,
    pastApps,
    monitoringEnabled: settings?.monitoringEnabled ?? true,
    scanIntervalMinutes: settings?.scanIntervalMinutes ?? 15,
    languages: settings ? JSON.parse(settings.languages) : ["en", "fr", "de"],
    lastScan: settings?.updatedAt ?? null,
  });
}
