/**
 * GET /api/jobs/[id]/details
 * Returns a job offer with full context:
 *   - the offer itself
 *   - company info (website, industry, size, linkedin)
 *   - career page URL + ATS system
 *   - cross-references (same job on other job boards / career page)
 *   - form field requirements for the source platform
 *   - account credential (if one exists for this platform)
 *   - application source label (career_page vs job_board)
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const offer = await db.jobOffer.findUnique({
    where: { id },
    include: {
      platform: true,
      companyRecord: {
        include: {
          careerPages: true,
          credentials: true,
        },
      },
      crossRefsAsPrimary: {
        include: {
          aliasOffer: {
            select: {
              id: true,
              title: true,
              company: true,
              url: true,
              platform: { select: { name: true } },
              applicationSource: true,
              status: true,
            },
          },
        },
      },
      crossRefsAsAlias: {
        include: {
          primaryOffer: {
            select: {
              id: true,
              title: true,
              company: true,
              url: true,
              platform: { select: { name: true } },
              applicationSource: true,
              status: true,
            },
          },
        },
      },
      applications: {
        select: {
          id: true,
          status: true,
          submittedVia: true,
          credentialId: true,
          qualityScore: true,
        },
      },
    },
  });

  if (!offer) {
    return NextResponse.json({ error: "Job offer not found" }, { status: 404 });
  }

  // Get form field requirements for this platform
  let formRequirements: unknown[] = [];
  if (offer.platformId) {
    formRequirements = await db.formFieldRequirement.findMany({
      where: { platformId: offer.platformId },
      orderBy: { isRequired: "desc" },
    });
  }

  // Get account credential for this platform
  let credential = null;
  if (offer.platformId) {
    credential = await db.accountCredential.findFirst({
      where: { platformId: offer.platformId },
    });
  }

  // Build cross-references list (both directions)
  const crossRefs = [
    ...offer.crossRefsAsPrimary.map((x) => ({
      id: x.id,
      source: x.source,
      confidence: x.confidence,
      url: x.url,
      offer: x.aliasOffer,
    })),
    ...offer.crossRefsAsAlias.map((x) => ({
      id: x.id,
      source: x.source,
      confidence: x.confidence,
      url: x.url,
      offer: x.primaryOffer,
    })),
  ];

  return NextResponse.json({
    offer: {
      id: offer.id,
      title: offer.title,
      company: offer.company,
      location: offer.location,
      url: offer.url,
      description: offer.description,
      contractType: offer.contractType,
      language: offer.language,
      salary: offer.salary,
      status: offer.status,
      importProgress: offer.importProgress,
      importStep: offer.importStep,
      applicationSource: offer.applicationSource,
      platform: offer.platform
        ? { name: offer.platform.name, url: offer.platform.url }
        : null,
    },
    company: offer.companyRecord
      ? {
          id: offer.companyRecord.id,
          name: offer.companyRecord.name,
          website: offer.companyRecord.website,
          industry: offer.companyRecord.industry,
          size: offer.companyRecord.size,
          linkedinUrl: offer.companyRecord.linkedinUrl,
          careerPages: offer.companyRecord.careerPages.map((cp) => ({
            url: cp.url,
            atsSystem: cp.atsSystem,
            jobsBoardUrl: cp.jobsBoardUrl,
          })),
        }
      : null,
    crossReferences: crossRefs,
    formRequirements: formRequirements.map((f: { id: string; fieldKey: string; fieldLabel: string; fieldType: string; isRequired: boolean; options: string | null; placeholder: string | null; detectionSelector: string | null }) => ({
      id: f.id,
      fieldKey: f.fieldKey,
      fieldLabel: f.fieldLabel,
      fieldType: f.fieldType,
      isRequired: f.isRequired,
      options: f.options ? JSON.parse(f.options) : null,
      placeholder: f.placeholder,
      detectionSelector: f.detectionSelector,
    })),
    credential: credential
      ? { id: credential.id, email: credential.email, status: credential.status }
      : null,
    application: offer.applications[0] ?? null,
  });
}
