/**
 * POST /api/scan
 * Monitoring scan cycle:
 *   - picks 1-3 random enabled platforms
 *   - for platforms with known RSS feeds: fetches real offers from RSS
 *   - for others: generates a realistic offer from the demo pool
 *   - inserts new offers as JobOffer with status "new"
 *   - updates platform.lastCheckedAt + newOffersCount
 *   - logs a notification entry for the activity feed
 *   - returns the newly created offers
 *
 * In production this would be replaced by real RSS/API pollers per platform.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Known RSS feeds for platforms that support them.
// URLs are server-only (not exposed to client). The shared list of platform
// names is in src/lib/rss-feeds.ts so the frontend can show an RSS badge.
const RSS_FEEDS: Record<string, { url: string; language: string; contractType: string }> = {
  "We Work Remotely": {
    url: "https://weworkremotely.com/remote-jobs.rss",
    language: "en",
    contractType: "remote",
  },
  "Remotive": {
    url: "https://remotive.com/remote-jobs.rss",
    language: "en",
    contractType: "remote",
  },
  "Remote OK": {
    url: "https://remoteok.com/remote-jobs.rss",
    language: "en",
    contractType: "remote",
  },
  "Working Nomads": {
    url: "https://www.workingnomads.com/jobs/feed",
    language: "en",
    contractType: "remote",
  },
  "Jobspresso": {
    url: "https://jobspresso.co/feed/",
    language: "en",
    contractType: "remote",
  },
  "Remote.co": {
    url: "https://remote.co/remote-jobs/feed/",
    language: "en",
    contractType: "remote",
  },
  "Himalayas": {
    url: "https://himalayas.app/feed.xml",
    language: "en",
    contractType: "remote",
  },
  "Europe Remotely": {
    url: "https://europeremotely.com/feed/",
    language: "en",
    contractType: "remote",
  },
  "JustRemote": {
    url: "https://justremote.co/remote-jobs.rss",
    language: "en",
    contractType: "remote",
  },
  "DailyRemote": {
    url: "https://dailyremote.com/remote-jobs/rss",
    language: "en",
    contractType: "remote",
  },
};

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
}

/**
 * Fetch and parse an RSS feed. Returns up to `limit` items.
 * Uses a simple regex-based parser (no external dependency).
 * Times out after 5s to avoid blocking the scan.
 */
async function fetchRssFeed(
  feedUrl: string,
  limit = 3
): Promise<RssItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Aply/0.1 (job monitoring agent)" },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const xml = await res.text();

    // Parse <item> blocks
    const items: RssItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
      const block = match[1];
      const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() ?? "";
      const link = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim() ?? "";
      const description = block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() ?? "";
      const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();
      if (title) {
        // Strip HTML from description
        const cleanDesc = description
          .replace(/<[^>]+>/g, "")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim()
          .slice(0, 600);
        items.push({ title, link, description: cleanDesc, pubDate });
      }
    }
    return items;
  } catch {
    // Network error, timeout, or parse failure · fall back to demo pool
    return [];
  }
}

/** Extract company name from an RSS item title (often "Company: Title" or "Title at Company") */
function extractCompany(title: string): { company: string | null; cleanTitle: string } {
  // "Company: Job Title"
  const colon = title.indexOf(":");
  if (colon > 0 && colon < 40) {
    return {
      company: title.slice(0, colon).trim(),
      cleanTitle: title.slice(colon + 1).trim(),
    };
  }
  // "Job Title at Company"
  const atIdx = title.lastIndexOf(" at ");
  if (atIdx > 5) {
    return {
      company: title.slice(atIdx + 4).trim(),
      cleanTitle: title.slice(0, atIdx).trim(),
    };
  }
  return { company: null, cleanTitle: title };
}

// Pool of realistic demo job offers, multilingual, all contract types
const OFFER_POOL: Array<{
  title: string;
  company: string;
  location: string;
  description: string;
  contractType: string;
  language: string;
  salary: string;
}> = [
  {
    title: "Senior Product Engineer (Full-Stack)",
    company: "Northwind",
    location: "Remote · EU",
    description:
      "We're looking for a senior full-stack engineer to own features end-to-end. Next.js, TypeScript, Postgres. You'll work closely with design and ship daily.",
    contractType: "remote",
    language: "en",
    salary: "$90k–$130k",
  },
  {
    title: "Développeur React Senior H/F",
    company: "Studio Méridien",
    location: "Lyon · hybride",
    description:
      "Studio Méridien cherche un développeur React senior pour rejoindre une équipe produit de 8 personnes. Stack moderne, culture craftsmanship.",
    contractType: "full-time",
    language: "fr",
    salary: "58k€–72k€",
  },
  {
    title: "Frontend Entwickler (m/w/d)",
    company: "München Labs",
    location: "München / Remote (DACH)",
    description:
      "Wir suchen einen Frontend Entwickler mit Erfahrung in React und TypeScript. Fokus auf Accessibility und Performance.",
    contractType: "full-time",
    language: "de",
    salary: "68k€–85k€",
  },
  {
    title: "Freelance: Next.js dashboard (6 weeks)",
    company: "Cobalt Analytics",
    location: "Remote",
    description:
      "Need a senior Next.js freelancer to build an internal analytics dashboard. Recharts, Prisma, shadcn/ui. 6 weeks, starting ASAP.",
    contractType: "freelance",
    language: "en",
    salary: "$70–$95/hr",
  },
  {
    title: "Stage · Développement Web React/Node",
    company: "Atelier Numérique",
    location: "Paris 10e",
    description:
      "Stage de fin d'études en développement web. React, Node.js, Prisma. Encadrement par un senior. Possibilité d'embauche à la fin.",
    contractType: "internship",
    language: "fr",
    salary: "1 500€–1 800€/mois",
  },
  {
    title: "Part-time Frontend Developer",
    company: "Driftwood Co.",
    location: "Remote (worldwide)",
    description:
      "We're a small remote team looking for a part-time frontend developer (3 days/week). React, TypeScript, Tailwind. Async-first culture.",
    contractType: "part-time",
    language: "en",
    salary: "$45k–$55k (pro-rated)",
  },
  {
    title: "Lead Engineer · Platform",
    company: "Forge",
    location: "Remote · US/EU",
    description:
      "Lead the platform team. Define architecture, mentor engineers, own the CI/CD pipeline. Deep Node.js + infra experience required.",
    contractType: "remote",
    language: "en",
    salary: "$140k–$180k",
  },
  {
    title: "Werkstudent Webentwicklung (m/w/d)",
    company: "BerlinTech GmbH",
    location: "Berlin",
    description:
      "Werkstudent-Position im Bereich Webentwicklung. React, TypeScript. 20h/Woche. Ideal für Studierende im Informatik-Studium.",
    contractType: "part-time",
    language: "de",
    salary: "15€–18€/Std",
  },
  {
    title: "Engineering Manager · Frontend",
    company: "Lumio",
    location: "Remote · Europe",
    description:
      "Lead a team of 6 frontend engineers. People management + technical leadership. You'll own the design system and the frontend roadmap.",
    contractType: "full-time",
    language: "en",
    salary: "$130k–$160k",
  },
  {
    title: "Alternance · Développeur Full-Stack",
    company: "ParisLab",
    location: "Paris 11e · hybride",
    description:
      "Alternance en développement full-stack (React/Node). 3 semaines en entreprise / 1 semaine en école. Poste en CDI à l'issue.",
    contractType: "internship",
    language: "fr",
    salary: "1 200€–1 500€/mois",
  },
  {
    title: "Senior Backend Engineer (Go)",
    company: "Tidepool",
    location: "Remote · EU/UK",
    description:
      "Join our backend team building distributed systems in Go. gRPC, Kafka, Kubernetes. You'll own services that handle millions of requests/day.",
    contractType: "remote",
    language: "en",
    salary: "£80k–£110k",
  },
  {
    title: "DevOps Engineer (m/w/d)",
    company: "Frankfurt Cloud",
    location: "Frankfurt / Remote",
    description:
      "DevOps Engineer für unser Cloud-Team. Kubernetes, Terraform, AWS. Deutsch und Englisch erforderlich.",
    contractType: "full-time",
    language: "de",
    salary: "75k€–95k€",
  },
];

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export async function POST(_req: NextRequest) {
  try {
    const enabledPlatforms = await db.platform.findMany({
      where: { enabled: true },
      select: { id: true, name: true, url: true, category: true },
    });

    if (enabledPlatforms.length === 0) {
      return NextResponse.json(
        { error: "No enabled platforms to scan" },
        { status: 400 }
      );
    }

    const scanCount = Math.floor(Math.random() * 3) + 1;
    const scanned = pickRandom(enabledPlatforms, Math.min(scanCount, enabledPlatforms.length));

    const newOffers: Array<{
      id: string;
      title: string;
      company: string;
      platformName: string;
    }> = [];
    const offersToCreate = pickRandom(OFFER_POOL, Math.floor(Math.random() * 2) + 1);

    for (const platform of scanned) {
      const now = Date.now();
      const id = `scan-${now}-${Math.random().toString(36).slice(2, 8)}`;

      // Try RSS feed first (if this platform has one)
      const feed = RSS_FEEDS[platform.name];
      let title: string;
      let company: string | null;
      let location: string | null = null;
      let offerUrl: string;
      let description: string;
      let contractType: string;
      let language: string;
      let salary: string | null = null;
      let postedAt: Date;
      let source: "rss" | "demo" = "demo";

      if (feed) {
        const rssItems = await fetchRssFeed(feed.url, 1);
        if (rssItems.length > 0) {
          const item = rssItems[0];
          const extracted = extractCompany(item.title);
          source = "rss";
          title = extracted.cleanTitle;
          company = extracted.company;
          offerUrl = item.link || `${platform.url}jobs/${id}`;
          description = item.description || `${title} at ${company ?? ""}`;
          contractType = feed.contractType;
          language = feed.language;
          postedAt = item.pubDate ? new Date(item.pubDate) : new Date(now);
        } else {
          // RSS failed · fall back to demo pool
          const offerTemplate = offersToCreate[Math.floor(Math.random() * offersToCreate.length)];
          title = offerTemplate.title;
          company = offerTemplate.company;
          location = offerTemplate.location;
          offerUrl = `${platform.url}jobs/${id}`;
          description = offerTemplate.description;
          contractType = offerTemplate.contractType;
          language = offerTemplate.language;
          salary = offerTemplate.salary;
          postedAt = new Date(now - Math.random() * 2 * 3600 * 1000);
        }
      } else {
        // No RSS feed · use demo pool
        const offerTemplate = offersToCreate[Math.floor(Math.random() * offersToCreate.length)];
        title = offerTemplate.title;
        company = offerTemplate.company;
        location = offerTemplate.location;
        offerUrl = `${platform.url}jobs/${id}`;
        description = offerTemplate.description;
        contractType = offerTemplate.contractType;
        language = offerTemplate.language;
        salary = offerTemplate.salary;
        postedAt = new Date(now - Math.random() * 2 * 3600 * 1000);
      }

      // Randomly assign import status to simulate the pipeline
      const isImporting = Math.random() < 0.3;
      const importProgress = isImporting ? Math.floor(Math.random() * 60) + 10 : 100;
      const importStep = isImporting
        ? ["detecting_fields", "generating_letter", "filling_form"][Math.floor(Math.random() * 3)]
        : "ready";
      const offerStatus = isImporting ? "importing" : "new";

      const created = await db.jobOffer.create({
        data: {
          id,
          platformId: platform.id,
          title,
          company,
          location,
          url: offerUrl,
          description,
          contractType,
          language,
          salary,
          postedAt,
          status: offerStatus,
          importProgress,
          importStep,
          applicationSource: "job_board",
        },
      });

      newOffers.push({
        id: created.id,
        title: created.title,
        company: created.company ?? "",
        platformName: platform.name,
        source,
      });

      await db.platform.update({
        where: { id: platform.id },
        data: {
          lastCheckedAt: new Date(now),
          newOffersCount: { increment: 1 },
        },
      });

      await db.notificationLog.create({
        data: {
          channel: "dashboard",
          direction: "out",
          status: "delivered",
          payload: JSON.stringify({
            type: "new_offer",
            offerId: created.id,
            title: created.title,
            company: created.company,
            platform: platform.name,
            source,
          }),
        },
      });
    }

    await db.setting.upsert({
      where: { id: "aply" },
      update: { updatedAt: new Date() },
      create: { id: "aply", updatedAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      scannedCount: scanned.length,
      newOffers,
      scannedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/scan] error:", err);
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
