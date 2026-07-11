/**
 * ATS API integration - fetches real jobs from Greenhouse and Lever public APIs.
 *
 * These are FREE, no-auth, public JSON APIs that thousands of tech companies use.
 * Greenhouse even supports application submission via POST.
 *
 * Greenhouse:
 *   GET https://boards-api.greenhouse.io/v1/boards/<token>/jobs
 *   POST https://boards-api.greenhouse.io/v1/boards/<token>/jobs/<id>/applications
 *
 * Lever:
 *   GET https://api.lever.co/v0/postings/<company>?mode=json
 *   POST https://api.lever.co/v0/postings/<posting_id>
 */

export interface AtsJob {
  id: string;
  title: string;
  company: string;
  location: string | null;
  url: string;
  description: string | null;
  contractType: string | null;
  language: string;
  postedAt: Date | null;
  atsSystem: "greenhouse" | "lever" | "ashby";
  boardToken: string;
}

/**
 * Extract the board token from a Greenhouse or Lever URL.
 * Examples:
 *   https://boards.greenhouse.io/lumio -> "lumio"
 *   https://jobs.lever.co/parislab -> "parislab"
 */
export function extractBoardToken(
  url: string,
  atsSystem: string
): string | null {
  if (atsSystem === "greenhouse") {
    const match = url.match(/greenhouse\.io\/([^/]+)/i);
    return match?.[1] ?? null;
  }
  if (atsSystem === "lever") {
    const match = url.match(/lever\.co\/([^/]+)/i);
    return match?.[1] ?? null;
  }
  if (atsSystem === "ashby") {
    const match = url.match(/ashbyhq\.com\/([^/]+)/i);
    return match?.[1] ?? null;
  }
  return null;
}

/**
 * Fetch jobs from Greenhouse public API.
 * No auth required. Returns JSON with all active job postings.
 */
async function fetchGreenhouseJobs(boardToken: string): Promise<AtsJob[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];

    return data.jobs.map((job: {
      id: number;
      title: string;
      location: { name: string } | null;
      absolute_url: string;
      content: string | null;
      departments?: Array<{ name: string }>;
      updated_at: string | null;
    }) => ({
      id: `gh-${boardToken}-${job.id}`,
      title: job.title,
      company: boardToken,
      location: job.location?.name ?? null,
      url: job.absolute_url,
      description: job.content?.replace(/<[^>]+>/g, "").slice(0, 800) ?? null,
      contractType: null,
      language: "en",
      postedAt: job.updated_at ? new Date(job.updated_at) : null,
      atsSystem: "greenhouse" as const,
      boardToken,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch jobs from Lever public API.
 * No auth required.
 */
async function fetchLeverJobs(company: string): Promise<AtsJob[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `https://api.lever.co/v0/postings/${company}?mode=json`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((job: {
      id: string;
      text: string;
      categories: { location: string; team: string; commitment: string } | null;
      hostedUrl: string;
      descriptionPlain: string | null;
      createdAt: number | null;
    }) => ({
      id: `lv-${company}-${job.id}`,
      title: job.text,
      company,
      location: job.categories?.location ?? null,
      url: job.hostedUrl,
      description: job.descriptionPlain?.slice(0, 800) ?? null,
      contractType: job.categories?.commitment ?? null,
      language: "en",
      postedAt: job.createdAt ? new Date(job.createdAt) : null,
      atsSystem: "lever" as const,
      boardToken: company,
    }));
  } catch {
    return [];
  }
}

/**
 * Main entry: fetch jobs from an ATS given the board URL + system type.
 */
export async function fetchAtsJobs(
  jobsBoardUrl: string,
  atsSystem: string
): Promise<AtsJob[]> {
  const token = extractBoardToken(jobsBoardUrl, atsSystem);
  if (!token) return [];

  if (atsSystem === "greenhouse") {
    return await fetchGreenhouseJobs(token);
  }
  if (atsSystem === "lever") {
    return await fetchLeverJobs(token);
  }
  return [];
}
