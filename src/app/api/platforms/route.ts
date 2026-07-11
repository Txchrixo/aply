/**
 * GET /api/platforms
 *   ?category=...&q=...&enabled=true&page=1&pageSize=24
 * Returns paginated, filterable list of monitored platforms.
 *
 * POST /api/platforms
 *   body: { name, url, category, languages[], contractTypes[], ... }
 * Adds a new custom platform to monitor.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const enabled = searchParams.get("enabled");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(96, Math.max(1, Number(searchParams.get("pageSize") ?? "24")));

  const where: Record<string, unknown> = {};
  if (category && category !== "all") where.category = category;
  if (q) where.name = { contains: q };
  if (enabled === "true") where.enabled = true;
  if (enabled === "false") where.enabled = false;

  const [total, items] = await Promise.all([
    db.platform.count({ where }),
    db.platform.findMany({
      where,
      orderBy: [{ priority: "desc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    items: items.map((p) => ({
      ...p,
      languages: JSON.parse(p.languages),
      contractTypes: JSON.parse(p.contractTypes),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.name || !body?.url) {
    return NextResponse.json(
      { error: "name and url are required" },
      { status: 400 }
    );
  }
  const created = await db.platform.create({
    data: {
      name: body.name,
      url: body.url,
      category: body.category ?? "niche",
      languages: JSON.stringify(body.languages ?? ["en"]),
      contractTypes: JSON.stringify(
        body.contractTypes ?? ["full-time", "remote"]
      ),
      hasLoginRequired: body.hasLoginRequired ?? false,
      hasAntiBot: body.hasAntiBot ?? false,
      priority: body.priority ?? "medium",
      notes: body.notes ?? null,
      enabled: body.enabled ?? true,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
