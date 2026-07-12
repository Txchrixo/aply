/**
 * GET /api/browser/status?platformId=
 */
import { NextRequest, NextResponse } from "next/server";
import { getOpenContext } from "@/lib/browser/manager";
import { getSession } from "@/lib/browser/session";

export async function GET(req: NextRequest) {
  const platformId = req.nextUrl.searchParams.get("platformId");
  if (!platformId) {
    return NextResponse.json({ error: "platformId required" }, { status: 400 });
  }
  try {
    const session = await getSession(platformId);
    return NextResponse.json({
      session,
      browserOpen: Boolean(getOpenContext(platformId)),
    });
  } catch (err) {
    console.error("[/api/browser/status]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Status failed" },
      { status: 500 }
    );
  }
}
