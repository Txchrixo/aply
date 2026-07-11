/**
 * GET /api/export?format=csv
 * Exports all applications (with job offer + platform info) as CSV.
 * Supports ?format=csv (default).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function csvEscape(value: string | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "csv";

  const applications = await db.application.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      jobOffer: { include: { platform: true } },
    },
  });

  if (format === "csv") {
    const headers = [
      "Date",
      "Status",
      "Job Title",
      "Company",
      "Platform",
      "Location",
      "Contract Type",
      "Language",
      "Salary",
      "Quality Score",
      "Approval Channel",
      "Submitted At",
      "Job URL",
    ];

    const rows = applications.map((a) => [
      a.createdAt.toISOString(),
      a.status,
      a.jobOffer?.title ?? "",
      a.jobOffer?.company ?? "",
      a.jobOffer?.platform?.name ?? "",
      a.jobOffer?.location ?? "",
      a.jobOffer?.contractType ?? "",
      a.language ?? a.jobOffer?.language ?? "",
      a.jobOffer?.salary ?? "",
      a.qualityScore != null ? `${Math.round(a.qualityScore * 100)}%` : "",
      a.approvalChannel ?? "",
      a.submittedAt?.toISOString() ?? "",
      a.jobOffer?.url ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="aply-applications-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
}
