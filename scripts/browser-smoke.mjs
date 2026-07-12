/**
 * Smoke test: launch a short-lived persistent Chromium context.
 * Usage: pnpm browser:smoke
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const dir = path.resolve(process.cwd(), ".aply", "browser-profiles", "_smoke");
fs.mkdirSync(dir, { recursive: true });

const headed = (process.env.APLY_BROWSER_HEADED ?? "false").toLowerCase() !== "false";

async function main() {
  console.log("[browser-smoke] launching…", { dir, headed });
  let context;
  try {
    context = await chromium.launchPersistentContext(dir, {
      headless: !headed,
      channel: "chrome",
      viewport: { width: 1024, height: 768 },
    });
  } catch {
    context = await chromium.launchPersistentContext(dir, {
      headless: true,
      viewport: { width: 1024, height: 768 },
    });
  }
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto("https://example.com", { waitUntil: "domcontentloaded" });
  const title = await page.title();
  console.log("[browser-smoke] ok — title:", title);
  await context.close();
}

main().catch((err) => {
  console.error("[browser-smoke] failed:", err);
  process.exit(1);
});
