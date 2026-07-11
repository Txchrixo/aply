/**
 * GET /api/ats/jobs?company=<name>
 * Fetches real jobs from a company's ATS (Greenhouse/Lever).
 * Uses the CompanyCareerPage table to find the board URL + ATS system.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchAtsJobs } from "@/lib/ats";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyName = searchParams.get("company");

  if (!companyName) {
    return NextResponse.json(
      { error: "company parameter required" },
      { status: 400 }
    );
  }

  const company = await db.company.findUnique({
    where: { name: companyName },
    include: { careerPages: true },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const allJobs: unknown[] = [];

  for (const cp of company.careerPages) {
    if (!cp.jobsBoardUrl || !cp.atsSystem) continue;
    const jobs = await fetchAtsJobs(cp.jobsBoardUrl, cp.atsSystem);
    allJobs.push(...jobs);
  }

  return NextResponse.json({
    company: company.name,
    jobCount: allJobs.length,
    jobs: allJobs,
  });
}
