/**
 * Resolve which logo to show for a job offer:
 * - career_page → company website / career URL / offer URL
 * - otherwise → platform URL
 */
import type { JobOffer } from "@/components/aply/types";

export function resolveOfferLogo(offer: JobOffer): {
  logoUrl: string | null;
  logoLabel: string | null;
} {
  const isCareer = offer.applicationSource === "career_page";
  const companySite =
    offer.companyRecord?.website?.trim() ||
    offer.companyRecord?.careerPages?.[0]?.url?.trim() ||
    null;

  if (isCareer) {
    return {
      logoUrl: companySite || offer.url || null,
      logoLabel: offer.company || offer.companyRecord?.name || null,
    };
  }

  return {
    logoUrl: offer.platform?.url || null,
    logoLabel: offer.platform?.name || null,
  };
}
