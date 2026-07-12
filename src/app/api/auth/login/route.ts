/**
 * POST /api/auth/login
 * Body: { email, password }
 * Demo-compatible: any non-empty email/password returns a signed extension token.
 */
import { NextRequest, NextResponse } from "next/server";
import { createExtensionToken } from "@/lib/extension-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (!password || password.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
    }

    const token = createExtensionToken(email);
    return NextResponse.json({
      ok: true,
      token,
      user: { email, name: email.split("@")[0] },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
