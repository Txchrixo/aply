/**
 * Apply to a job URL using the platform's persistent Playwright profile.
 * Fills common fields + resume file input; submits only when confirmSubmit=true and no CAPTCHA.
 */
import type { Page } from "playwright";
import { db } from "@/lib/db";
import { detectCaptcha } from "@/lib/browser/captcha";
import { getOrLaunchContext } from "@/lib/browser/manager";
import { loadApplicantProfile } from "@/lib/browser/profile";
import {
  isPlatformReadyToApply,
  upsertSession,
} from "@/lib/browser/session";
import type { ApplicantProfile, ApplyResult } from "@/lib/browser/types";
import { isBrowserHeaded } from "@/lib/browser/paths";

async function fillCommonFields(page: Page, profile: ApplicantProfile) {
  let filled = 0;

  const tryFill = async (
    selectors: string[],
    value: string,
    asTextarea = false
  ) => {
    if (!value) return;
    for (const sel of selectors) {
      const loc = page.locator(sel).first();
      if (!(await loc.isVisible({ timeout: 500 }).catch(() => false))) continue;
      try {
        if (asTextarea) await loc.fill(value);
        else await loc.fill(value);
        filled++;
        return;
      } catch {
        /* try next */
      }
    }
  };

  await tryFill(
    [
      'input[name*="email" i]',
      'input[type="email"]',
      'input[id*="email" i]',
      'input[autocomplete="email"]',
    ],
    profile.email
  );
  await tryFill(
    [
      'input[name*="first" i]',
      'input[id*="first" i]',
      'input[autocomplete="given-name"]',
    ],
    profile.firstName
  );
  await tryFill(
    [
      'input[name*="last" i]',
      'input[id*="last" i]',
      'input[autocomplete="family-name"]',
    ],
    profile.lastName
  );
  await tryFill(
    [
      'input[name*="name" i]:not([name*="first" i]):not([name*="last" i])',
      'input[id*="full" i]',
      'input[autocomplete="name"]',
    ],
    profile.fullName || `${profile.firstName} ${profile.lastName}`.trim()
  );
  await tryFill(
    [
      'input[type="tel"]',
      'input[name*="phone" i]',
      'input[id*="phone" i]',
      'input[autocomplete="tel"]',
    ],
    profile.phone
  );
  await tryFill(
    [
      'input[name*="linkedin" i]',
      'input[id*="linkedin" i]',
      'input[placeholder*="linkedin" i]',
    ],
    profile.linkedin
  );
  await tryFill(
    [
      "textarea[name*='cover' i]",
      "textarea[id*='cover' i]",
      "textarea[name*='letter' i]",
      "textarea[name*='motivation' i]",
      "textarea[name*='message' i]",
      "textarea",
    ],
    profile.coverLetter,
    true
  );

  if (profile.resumeFilePath) {
    filled += await attachResumeFile(page, profile);
  }

  return filled;
}

/** Attach stored resume to the most likely CV/resume file input. */
async function attachResumeFile(
  page: Page,
  profile: ApplicantProfile
): Promise<number> {
  if (!profile.resumeFilePath) return 0;

  const selectors = [
    'input[type="file"][name*="resume" i]',
    'input[type="file"][id*="resume" i]',
    'input[type="file"][name*="cv" i]',
    'input[type="file"][id*="cv" i]',
    'input[type="file"][accept*="pdf" i]',
    'input[type="file"][name*="upload" i]',
    'input[type="file"]',
  ];

  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if (!(await loc.count().catch(() => 0))) continue;
    try {
      await loc.setInputFiles(profile.resumeFilePath);
      return 1;
    } catch {
      /* try next */
    }
  }
  return 0;
}

async function clickSubmit(page: Page): Promise<boolean> {
  const candidates = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("Submit")',
    'button:has-text("Apply")',
    'button:has-text("Send")',
    'button:has-text("Envoyer")',
    'button:has-text("Postuler")',
  ];
  for (const sel of candidates) {
    const loc = page.locator(sel).first();
    if (await loc.isVisible({ timeout: 400 }).catch(() => false)) {
      try {
        await loc.click({ timeout: 5_000 });
        return true;
      } catch {
        /* next */
      }
    }
  }
  return false;
}

export async function applyApplication(
  applicationId: string,
  opts?: { confirmSubmit?: boolean; headed?: boolean }
): Promise<ApplyResult> {
  const confirmSubmit = opts?.confirmSubmit ?? true;

  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      jobOffer: { include: { platform: true } },
    },
  });

  if (!app?.jobOffer) {
    return {
      ok: false,
      submitted: false,
      filledCount: 0,
      captcha: false,
      error: "Application or job offer not found",
    };
  }

  const platform = app.jobOffer.platform;
  if (!platform) {
    return {
      ok: false,
      submitted: false,
      filledCount: 0,
      captcha: false,
      error: "Job has no platform",
    };
  }

  const ready = await isPlatformReadyToApply(platform.id);
  if (!ready.ok) {
    return {
      ok: false,
      submitted: false,
      filledCount: 0,
      captcha: false,
      error: ready.reason,
    };
  }

  const profile = await loadApplicantProfile(app.coverLetter ?? "");
  const headed = opts?.headed ?? isBrowserHeaded();

  try {
    const managed = await getOrLaunchContext(platform.id, { headed });
    await upsertSession(platform.id, {
      status: ready.requiresLogin ? "connected" : "connected",
      touchLastUsed: true,
    });

    const page = await managed.context.newPage();
    await page.goto(app.jobOffer.url, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    if (await detectCaptcha(page)) {
      await upsertSession(platform.id, {
        status: "waiting_captcha",
        lastError: "CAPTCHA on apply page — solve it then approve again",
      });
      return {
        ok: false,
        submitted: false,
        filledCount: 0,
        captcha: true,
        error: "CAPTCHA detected — solve it in the browser, then approve again",
        message: "waiting_captcha",
      };
    }

    const filledCount = await fillCommonFields(page, profile);

    if (!confirmSubmit) {
      return {
        ok: true,
        submitted: false,
        filledCount,
        captcha: false,
        message: "Fields filled (submit skipped)",
      };
    }

    if (await detectCaptcha(page)) {
      await upsertSession(platform.id, {
        status: "waiting_captcha",
        lastError: "CAPTCHA before submit",
      });
      return {
        ok: false,
        submitted: false,
        filledCount,
        captcha: true,
        error: "CAPTCHA before submit — solve it in the browser",
      };
    }

    const clicked = await clickSubmit(page);
    if (!clicked) {
      return {
        ok: true,
        submitted: false,
        filledCount,
        captcha: false,
        message:
          "Filled fields but no submit button found — finish in the open browser",
      };
    }

    await new Promise((r) => setTimeout(r, 1500));
    if (await detectCaptcha(page)) {
      await upsertSession(platform.id, {
        status: "waiting_captcha",
        lastError: "CAPTCHA after submit click",
      });
      return {
        ok: false,
        submitted: false,
        filledCount,
        captcha: true,
        error: "CAPTCHA after submit — complete it in the browser",
      };
    }

    return {
      ok: true,
      submitted: true,
      filledCount,
      captcha: false,
      message: "Submitted via browser agent",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Apply failed";
    await upsertSession(platform.id, {
      status: "error",
      lastError: message,
    }).catch(() => undefined);
    return {
      ok: false,
      submitted: false,
      filledCount: 0,
      captcha: false,
      error: message,
    };
  }
}
