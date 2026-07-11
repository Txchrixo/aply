/**
 * GET /api/platforms/[id]/stats
 * Returns detailed stats for a single platform:
 *   - platform info (name, url, category, languages, contractTypes, etc.)
 *   - total offers detected
 *   - offers by status
 *   - recent offers (last 10)
 *   - applications count (submitted/pending/rejected)
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const platform = await db.platform.findUnique({ where: { id } });
  if (!platform) {
    return NextResponse.json({ error: "Platform not found" }, { status: 404 });
  }

  const [offers, applicationCount] = await Promise.all([
    db.jobOffer.findMany({
      where: { platformId: id },
      orderBy: { detectedAt: "desc" },
      take: 10,
      include: {
        applications: {
          select: {
            id: true,
            status: true,
            qualityScore: true,
            language: true,
          },
        },
      },
    }),
    db.application.count({
      where: { jobOffer: { platformId: id } },
    }),
  ]);

  const totalOffers = await db.jobOffer.count({
    where: { platformId: id },
  });
  const newOffers = await db.jobOffer.count({
    where: { platformId: id, status: "new" },
  });
  const pendingOffers = await db.jobOffer.count({
    where: { platformId: id, status: "pending_approval" },
  });
  const appliedOffers = await db.jobOffer.count({
    where: { platformId: id, status: "applied" },
  });

  return NextResponse.json({
    platform: {
      ...platform,
      languages: JSON.parse(platform.languages),
      contractTypes: JSON.parse(platform.contractTypes),
    },
    stats: {
      totalOffers,
      newOffers,
      pendingOffers,
      appliedOffers,
      totalApplications: applicationCount,
    },
    recentOffers: offers.map((o) => ({
      id: o.id,
      title: o.title,
      company: o.company,
      location: o.location,
      salary: o.salary,
      contractType: o.contractType,
      language: o.language,
      status: o.status,
      detectedAt: o.detectedAt,
      url: o.url,
      hasApplication: o.applications.length > 0,
      applicationStatus: o.applications[0]?.status ?? null,
      qualityScore: o.applications[0]?.qualityScore ?? null,
    })),
  });
}
