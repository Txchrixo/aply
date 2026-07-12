/**
 * POST /api/browser/disconnect · { platformId }
 */
import { NextRequest, NextResponse } from "next/server";
import { disconnectPlatform } from "@/lib/browser/connect";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const platformId = String(body?.platformId ?? "").trim();
    if (!platformId) {
      return NextResponse.json({ error: "platformId required" }, { status: 400 });
    }
    const result = await disconnectPlatform(platformId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/browser/disconnect]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Disconnect failed" },
      { status: 500 }
    );
  }
}
