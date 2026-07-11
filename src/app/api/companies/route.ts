/**
 * GET /api/companies
 * Returns all tracked companies with their career pages + offer counts.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const companies = await db.company.findMany({
    include: {
      careerPages: true,
      _count: {
        select: { jobOffers: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    items: companies.map((c) => ({
      id: c.id,
      name: c.name,
      website: c.website,
      industry: c.industry,
      size: c.size,
      linkedinUrl: c.linkedinUrl,
      careerPages: c.careerPages.map((cp) => ({
        url: cp.url,
        atsSystem: cp.atsSystem,
        jobsBoardUrl: cp.jobsBoardUrl,
        enabled: cp.enabled,
      })),
      offerCount: c._count.jobOffers,
    })),
  });
}
