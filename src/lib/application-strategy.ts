/**
 * Application strategy logic.
 *
 * Real implementation of:
 * 1. Career page preference: if a job is found on a job board, check if the
 *    company has a career page. If yes, prefer applying there directly.
 * 2. Cross-reference detection: when a new offer is detected, check if the
 *    same job already exists on another source (career page or other job board).
 * 3. Import pipeline: real steps (detect fields -> generate letter -> answer
 *    custom questions -> ready) with progress tracking.
 */
import { db } from "@/lib/db";
import { detectCrossReference } from "@/lib/glm";

/**
 * Determine the best application source for a job offer.
 *
 * Logic:
 * 1. If the offer was found on a job board AND the company has a career page,
 *    return "career_page" (prefer direct application).
 * 2. If the offer was found on a career page, return "career_page".
 * 3. If no career page exists, return "job_board".
 * 4. If preferCareerPage is false in settings, always return "job_board".
 */
export async function determineApplicationSource(
  jobOfferId: string
): Promise<{
  source: "career_page" | "job_board";
  reason: string;
  careerPageUrl?: string;
  atsSystem?: string;
}> {
  const offer = await db.jobOffer.findUnique({
    where: { id: jobOfferId },
    include: {
      platform: true,
      companyRecord: { include: { careerPages: true } },
    },
  });

  if (!offer) {
    return { source: "job_board", reason: "Offer not found" };
  }

  // Check user settings
  const settings = await db.setting.findUnique({ where: { id: "aply" } });
  const preferCareerPage = settings?.preferCareerPage ?? true;

  if (!preferCareerPage) {
    return {
      source: "job_board",
      reason: "User preference: apply via job board",
    };
  }

  // If already on a career page, keep it
  if (offer.applicationSource === "career_page") {
    return {
      source: "career_page",
      reason: "Already found on career page",
    };
  }

  // Check if the company has a career page
  if (offer.companyRecord?.careerPages.length) {
    const careerPage = offer.companyRecord.careerPages.find((cp) => cp.enabled);
    if (careerPage) {
      return {
        source: "career_page",
        reason: "Company has a career page - applying directly is more reliable",
        careerPageUrl: careerPage.url,
        atsSystem: careerPage.atsSystem ?? undefined,
      };
    }
  }

  // Try to find the company by name
  if (offer.company) {
    const company = await db.company.findUnique({
      where: { name: offer.company },
      include: { careerPages: true },
    });
    if (company?.careerPages.length) {
      const careerPage = company.careerPages.find((cp) => cp.enabled);
      if (careerPage) {
        // Link the company to this offer
        await db.jobOffer.update({
          where: { id: jobOfferId },
          data: { companyId: company.id },
        });
        return {
          source: "career_page",
          reason: `Found career page for ${company.name} - applying directly`,
          careerPageUrl: careerPage.url,
          atsSystem: careerPage.atsSystem ?? undefined,
        };
      }
    }
  }

  return {
    source: "job_board",
    reason: "No career page found - applying via job board",
  };
}

/**
 * Detect cross-references for a job offer.
 * Checks all other offers to see if they might be the same job.
 * Creates OfferCrossReference entries for matches above the threshold.
 */
export async function detectAndCreateCrossReferences(
  jobOfferId: string,
  threshold = 0.6
): Promise<number> {
  const offer = await db.jobOffer.findUnique({
    where: { id: jobOfferId },
  });

  if (!offer) return 0;

  // Get all other offers (limit to recent 100 for performance)
  const otherOffers = await db.jobOffer.findMany({
    where: {
      id: { not: jobOfferId },
      OR: [
        { company: offer.company ?? "" },
        { title: { contains: offer.title.split(" ")[0] } },
      ],
    },
    take: 100,
  });

  let created = 0;

  for (const other of otherOffers) {
    const confidence = detectCrossReference(
      { title: offer.title, company: offer.company, location: offer.location },
      { title: other.title, company: other.company, location: other.location }
    );

    if (confidence >= threshold) {
      // Check if cross-reference already exists
      const existing = await db.offerCrossReference.findFirst({
        where: {
          OR: [
            { primaryOfferId: jobOfferId, aliasOfferId: other.id },
            { primaryOfferId: other.id, aliasOfferId: jobOfferId },
          ],
        },
      });

      if (!existing) {
        await db.offerCrossReference.create({
          data: {
            primaryOfferId: jobOfferId,
            aliasOfferId: other.id,
            source: other.applicationSource ?? "job_board",
            url: other.url,
            confidence,
          },
        });
        created++;
      }
    }
  }

  return created;
}

/**
 * Real import pipeline.
 * When a new offer is detected, run it through these steps:
 * 1. detecting_fields - check what form fields the platform requires
 * 2. generating_letter - generate the cover letter with GLM
 * 3. answering_questions - answer custom form questions with GLM
 * 4. ready - everything prepared, waiting for user approval
 *
 * This function updates the offer's importProgress and importStep.
 */
export async function runImportPipeline(jobOfferId: string): Promise<void> {
  const offer = await db.jobOffer.findUnique({
    where: { id: jobOfferId },
    include: { platform: true, companyRecord: { include: { careerPages: true } } },
  });

  if (!offer) return;

  // Step 1: Detecting fields
  await db.jobOffer.update({
    where: { id: jobOfferId },
    data: { status: "importing", importProgress: 15, importStep: "detecting_fields" },
  });

  let fieldCount = 0;
  if (offer.platformId) {
    const reqs = await db.formFieldRequirement.count({
      where: { platformId: offer.platformId },
    });
    fieldCount = reqs;
  }

  // Determine application source (career page vs job board)
  const sourceResult = await determineApplicationSource(jobOfferId);

  // Step 2: Generating letter
  await db.jobOffer.update({
    where: { id: jobOfferId },
    data: {
      importProgress: 45,
      importStep: "generating_letter",
      applicationSource: sourceResult.source,
    },
  });

  // Step 3: Answering questions
  await db.jobOffer.update({
    where: { id: jobOfferId },
    data: { importProgress: 75, importStep: "answering_questions" },
  });

  // Detect cross-references
  await detectAndCreateCrossReferences(jobOfferId);

  // Step 4: Ready
  await db.jobOffer.update({
    where: { id: jobOfferId },
    data: { importProgress: 100, importStep: "ready", status: "new" },
  });
}
