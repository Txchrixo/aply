/**
 * GET /api/browser/sessions — list all BrowserSession rows (+ open contexts).
 */
import { NextResponse } from "next/server";
import { listOpenPlatformIds } from "@/lib/browser/manager";
import { listSessions } from "@/lib/browser/session";

export async function GET() {
  try {
    const sessions = await listSessions();
    const open = new Set(listOpenPlatformIds());
    return NextResponse.json({
      items: sessions.map((s) => ({
        ...s,
        browserOpen: open.has(s.platformId),
      })),
      openPlatformIds: [...open],
    });
  } catch (err) {
    console.error("[/api/browser/sessions]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list sessions" },
      { status: 500 }
    );
  }
}
