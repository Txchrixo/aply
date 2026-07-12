/**
 * POST /api/browser/connect · { platformId }
 * Opens a headed persistent browser on the platform URL.
 */
import { NextRequest, NextResponse } from "next/server";
import { startPlatformConnect } from "@/lib/browser/connect";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const platformId = String(body?.platformId ?? "").trim();
    if (!platformId) {
      return NextResponse.json({ error: "platformId required" }, { status: 400 });
    }
    const result = await startPlatformConnect(platformId);
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (err) {
    console.error("[/api/browser/connect]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Connect failed" },
      { status: 500 }
    );
  }
}
