/**
 * GET /api/settings
 * POST /api/settings  · update the singleton Aply settings row.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  let s = await db.setting.findUnique({ where: { id: "aply" } });
  if (!s) {
    s = await db.setting.create({ data: { id: "aply" } });
  }
  return NextResponse.json({
    ...s,
    languages: JSON.parse(s.languages),
    accountEmails: JSON.parse(s.accountEmails),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof body.monitoringEnabled === "boolean")
    data.monitoringEnabled = body.monitoringEnabled;
  if (typeof body.scanIntervalMinutes === "number")
    data.scanIntervalMinutes = body.scanIntervalMinutes;
  if (typeof body.antiAiStrictMode === "boolean")
    data.antiAiStrictMode = body.antiAiStrictMode;
  if (typeof body.autoApproveThreshold === "number")
    data.autoApproveThreshold = body.autoApproveThreshold;
  if (body.notifyChannel) data.notifyChannel = body.notifyChannel;
  if (typeof body.notifyEmail === "string") data.notifyEmail = body.notifyEmail;
  if (typeof body.notifyWhatsapp === "string")
    data.notifyWhatsapp = body.notifyWhatsapp;
  if (Array.isArray(body.languages)) data.languages = JSON.stringify(body.languages);
  if (Array.isArray(body.accountEmails))
    data.accountEmails = JSON.stringify(body.accountEmails);
  if (typeof body.preferCareerPage === "boolean")
    data.preferCareerPage = body.preferCareerPage;

  const updated = await db.setting.upsert({
    where: { id: "aply" },
    update: data,
    create: { id: "aply", ...data },
  });
  return NextResponse.json({
    ...updated,
    languages: JSON.parse(updated.languages),
    accountEmails: JSON.parse(updated.accountEmails),
  });
}
