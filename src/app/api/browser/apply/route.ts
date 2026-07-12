/**
 * POST /api/browser/apply · { applicationId, confirmSubmit?: boolean }
 */
import { NextRequest, NextResponse } from "next/server";
import { applyApplication } from "@/lib/browser/apply";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const applicationId = String(body?.applicationId ?? "").trim();
    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId required" },
        { status: 400 }
      );
    }
    const result = await applyApplication(applicationId, {
      confirmSubmit: body?.confirmSubmit !== false,
      headed: body?.headed,
    });
    return NextResponse.json(result, { status: result.ok || result.captcha ? 200 : 500 });
  } catch (err) {
    console.error("[/api/browser/apply]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Apply failed" },
      { status: 500 }
    );
  }
}
