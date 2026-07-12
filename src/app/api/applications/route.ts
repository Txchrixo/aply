/**
 * GET /api/applications
 *   ?status=pending_approval|draft|submitted|rejected|...&page=1&pageSize=20
 * Returns applications with their job offer + platform.
 *
 * POST /api/applications
 *   body: { jobOfferId, coverLetter?, language?, formFields?, status? }
 * Creates / updates a draft application.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    96,
    Math.max(1, Number(searchParams.get("pageSize") ?? "20"))
  );

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;

  const [total, items] = await Promise.all([
    db.application.count({ where }),
    db.application.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        jobOffer: {
          include: {
            platform: true,
            companyRecord: {
              select: {
                id: true,
                name: true,
                website: true,
                careerPages: {
                  where: { enabled: true },
                  select: { url: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    items: items.map((a) => ({
      ...a,
      formFields: a.formFields ? JSON.parse(a.formFields) : null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { jobOfferId, coverLetter, language, formFields, status } = body;
  if (!jobOfferId) {
    return NextResponse.json(
      { error: "jobOfferId is required" },
      { status: 400 }
    );
  }
  const created = await db.application.create({
    data: {
      jobOfferId,
      coverLetter,
      language,
      formFields: formFields ? JSON.stringify(formFields) : null,
      status: status ?? "draft",
    },
    include: { jobOffer: { include: { platform: true } } },
  });
  return NextResponse.json(created, { status: 201 });
}
