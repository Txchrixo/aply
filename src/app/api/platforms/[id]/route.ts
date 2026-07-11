/**
 * PATCH /api/platforms/[id]
 *   body: { enabled?, priority?, ... }
 * Toggles / updates a monitored platform.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (body.priority) data.priority = body.priority;
  if (typeof body.hasLoginRequired === "boolean")
    data.hasLoginRequired = body.hasLoginRequired;
  if (typeof body.hasAntiBot === "boolean") data.hasAntiBot = body.hasAntiBot;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.languages) data.languages = JSON.stringify(body.languages);
  if (body.contractTypes)
    data.contractTypes = JSON.stringify(body.contractTypes);

  const updated = await db.platform.update({ where: { id }, data });
  return NextResponse.json({
    ...updated,
    languages: JSON.parse(updated.languages),
    contractTypes: JSON.parse(updated.contractTypes),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.platform.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
