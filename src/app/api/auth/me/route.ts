/**
 * GET /api/auth/me
 * Authorization: Bearer <token>
 */
import { NextRequest, NextResponse } from "next/server";
import { requireExtensionAuth } from "@/lib/extension-auth";

export async function GET(req: NextRequest) {
  const session = requireExtensionAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    user: { email: session.email, name: session.email.split("@")[0] },
  });
}
