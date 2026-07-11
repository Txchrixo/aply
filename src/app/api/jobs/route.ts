/**
 * GET /api/jobs
 *   ?status=new|pending_approval|applied|...&page=1&pageSize=20
 * Returns detected job offers with their platform.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    96,
    Math.max(1, Number(searchParams.get("pageSize") ?? "20"))
  );

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;

  const [total, items] = await Promise.all([
    db.jobOffer.count({ where }),
    db.jobOffer.findMany({
      where,
      orderBy: { detectedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { platform: true },
    }),
  ]);

  return NextResponse.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}
