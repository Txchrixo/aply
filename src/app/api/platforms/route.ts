/**
 * GET /api/platforms
 *   ?category=...&q=...&enabled=true&loginRequired=true&sessionStatus=connected&page=1&pageSize=24
 * Returns paginated, filterable list of monitored platforms.
 * With loginRequired=true, famous boards stay pinned at the top.
 * sessionStatus=connected | not_connected filters by BrowserSession.
 *
 * POST /api/platforms
 *   body: { name, url, category, languages[], contractTypes[], ... }
 * Adds a new custom platform to monitor.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Shown first in onboarding "connect" lists (must require login). */
const FEATURED_LOGIN_PLATFORMS = [
  "LinkedIn Jobs",
  "Indeed",
  "Welcome to the Jungle",
  "Upwork",
] as const;

const PRIORITY_RANK: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function sortPlatforms<
  T extends { name: string; priority: string; hasLoginRequired?: boolean }
>(items: T[], mode: "featured" | "onboarding" | "default"): T[] {
  const featuredIndex = new Map(
    FEATURED_LOGIN_PLATFORMS.map((name, i) => [name, i])
  );

  return [...items].sort((a, b) => {
    if (mode === "onboarding") {
      return a.name.localeCompare(b.name);
    }
    if (mode === "featured") {
      const fa = featuredIndex.has(a.name) ? featuredIndex.get(a.name)! : 999;
      const fb = featuredIndex.has(b.name) ? featuredIndex.get(b.name)! : 999;
      if (fa !== fb) return fa - fb;
    }

    const pa = PRIORITY_RANK[a.priority] ?? 9;
    const pb = PRIORITY_RANK[b.priority] ?? 9;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const enabled = searchParams.get("enabled");
  const loginRequired = searchParams.get("loginRequired");
  const sessionStatus = searchParams.get("sessionStatus");
  const onboarding = searchParams.get("onboarding") === "true";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    96,
    Math.max(1, Number(searchParams.get("pageSize") ?? "24"))
  );

  const where: Record<string, unknown> = {};
  if (category && category !== "all") where.category = category;
  if (q) where.name = { contains: q };
  if (enabled === "true") where.enabled = true;
  if (enabled === "false") where.enabled = false;
  if (loginRequired === "true") where.hasLoginRequired = true;
  if (loginRequired === "false") where.hasLoginRequired = false;
  if (sessionStatus === "connected") {
    where.browserSession = { is: { status: "connected" } };
  } else if (sessionStatus === "not_connected") {
    // No session, or session exists but not "connected"
    where.NOT = { browserSession: { is: { status: "connected" } } };
  }

  const sortMode = onboarding
    ? "onboarding"
    : loginRequired === "true"
      ? "featured"
      : "default";

  // Custom order (featured / onboarding groups) then paginate in memory
  if (sortMode !== "default") {
    const all = await db.platform.findMany({ where });
    const ordered = sortPlatforms(all, sortMode);
    const total = ordered.length;
    const slice = ordered.slice((page - 1) * pageSize, page * pageSize);
    const loginCount = ordered.filter((p) => p.hasLoginRequired).length;

    return NextResponse.json({
      items: slice.map((p) => ({
        ...p,
        languages: JSON.parse(p.languages),
        contractTypes: JSON.parse(p.contractTypes),
      })),
      total,
      loginCount,
      managedCount: total - loginCount,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    });
  }

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
