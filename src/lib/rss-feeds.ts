/**
 * Shared list of platforms that have known RSS feeds.
 * Used by:
 *   - /api/scan (server-side fetching)
 *   - Platform cards + drawer (client-side RSS badge)
 *
 * Keep this in sync with the RSS_FEEDS map in src/app/api/scan/route.ts.
 */
export const RSS_FEED_PLATFORMS: Record<
  string,
  { language: string; contractType: string }
> = {
  "We Work Remotely": { language: "en", contractType: "remote" },
  "Remotive": { language: "en", contractType: "remote" },
  "Remote OK": { language: "en", contractType: "remote" },
  "Working Nomads": { language: "en", contractType: "remote" },
  "Jobspresso": { language: "en", contractType: "remote" },
  "Remote.co": { language: "en", contractType: "remote" },
  "Himalayas": { language: "en", contractType: "remote" },
  "Europe Remotely": { language: "en", contractType: "remote" },
  "JustRemote": { language: "en", contractType: "remote" },
  "DailyRemote": { language: "en", contractType: "remote" },
};

/** Check if a platform name has a known RSS feed */
export function hasRssFeed(platformName: string): boolean {
  return platformName in RSS_FEED_PLATFORMS;
}
