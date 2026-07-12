/**
 * POST /api/browser/confirm · { platformId }
 * Marks the platform session as connected after manual login.
 */
import { NextRequest, NextResponse } from "next/server";
import { confirmPlatformConnect } from "@/lib/browser/connect";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const platformId = String(body?.platformId ?? "").trim();
    if (!platformId) {
      return NextResponse.json({ error: "platformId required" }, { status: 400 });
    }
    const result = await confirmPlatformConnect(platformId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/browser/confirm]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Confirm failed" },
      { status: 500 }
    );
  }
}
