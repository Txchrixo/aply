/**
 * Server-only user greeting resolution (uses Prisma).
 * Prefers Setting.firstName from signup — never invents a name from email.
 */
import { db } from "@/lib/db";
import { isSeedResume } from "@/lib/onboarding";
import {
  greetingName,
  nameFromStructuredJson,
} from "@/lib/user-identity";

/**
 * Best available name for "Hi {name},".
 * Order: firstName (signup) → non-seed resume → "there".
 */
export async function resolveUserGreetingName(): Promise<string> {
  const settings = await db.setting.findUnique({ where: { id: "aply" } });
  const fromProfile = greetingName(settings?.firstName);
  if (fromProfile) return fromProfile;

  const resume = await db.resume.findFirst({
    where: { isDefault: true },
    select: { structured: true, rawText: true },
  });

  if (resume && !isSeedResume(resume.rawText)) {
    const fromResume = nameFromStructuredJson(resume.structured ?? null);
    if (fromResume) return fromResume;
  }

  return "there";
}
