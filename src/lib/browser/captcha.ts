/**
 * Detect common CAPTCHA / bot-challenge UI on a page.
 */
import type { Page } from "playwright";

const CAPTCHA_SELECTORS = [
  "iframe[src*='recaptcha']",
  "iframe[src*='hcaptcha']",
  "iframe[src*='turnstile']",
  ".g-recaptcha",
  "#challenge-form",
  "[data-callback*='captcha']",
  "text=/unusual activity/i",
  "text=/verify you.re human/i",
  "text=/security check/i",
  "text=/captcha/i",
  "text=/challenge/i",
];

export async function detectCaptcha(page: Page): Promise<boolean> {
  for (const sel of CAPTCHA_SELECTORS) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 400 }).catch(() => false)) {
        return true;
      }
    } catch {
      /* continue */
    }
  }

  const url = page.url().toLowerCase();
  if (
    url.includes("/checkpoint/") ||
    url.includes("challenge") ||
    url.includes("captcha") ||
    url.includes("authwall")
  ) {
    return true;
  }

  return false;
}
