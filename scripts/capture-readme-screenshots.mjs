import { chromium } from "playwright";
import path from "node:path";

const baseUrl = process.env.APLY_BASE_URL ?? "http://localhost:4000";
const outDir = path.resolve(process.cwd(), "docs", "screenshots");
const viewport = { width: 1440, height: 900 };

async function waitForSettledPage(page) {
  await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1800);
}

async function screenshot(page, name) {
  await page.screenshot({
    path: path.join(outDir, name),
    fullPage: false,
  });
  console.log(`[screenshots] wrote ${name}`);
}

async function openDashboardView(page, view) {
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "commit", timeout: 15000 });
  await page.evaluate((nextView) => {
    localStorage.setItem("aply-dash-view", nextView);
    localStorage.setItem("aply-dash-sidebar-collapsed", "0");
  }, view);
  await page.reload({ waitUntil: "commit", timeout: 15000 });
  await waitForSettledPage(page);
}

async function main() {
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.route("**/api/onboarding", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ completed: true, step: 5 }),
    });
  });

  await page.goto(baseUrl, { waitUntil: "commit", timeout: 15000 });
  await waitForSettledPage(page);
  await screenshot(page, "00-landing.png");

  await openDashboardView(page, "platforms");
  await screenshot(page, "02-platforms.png");

  await openDashboardView(page, "offers");
  await screenshot(page, "03-offers.png");

  await browser.close();
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
