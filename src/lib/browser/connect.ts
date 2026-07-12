/**
 * Connect flow: open platform URL in a headed persistent browser.
 * User logs in manually; CAPTCHA pauses update session status.
 * Confirm via /api/browser/confirm after login.
 */
import { db } from "@/lib/db";
import { detectCaptcha } from "@/lib/browser/captcha";
import { closeContext, getOrLaunchContext } from "@/lib/browser/manager";
import { upsertSession } from "@/lib/browser/session";
import type { ConnectResult } from "@/lib/browser/types";

const WATCH_MS = 90_000;
const POLL_MS = 2_000;

export async function startPlatformConnect(
  platformId: string
): Promise<ConnectResult> {
  const platform = await db.platform.findUnique({ where: { id: platformId } });
  if (!platform) {
    return {
      ok: false,
      status: "error",
      profilePath: "",
      error: "Platform not found",
    };
  }

  await upsertSession(platformId, {
    status: "connecting",
    lastError: null,
  });

  try {
    const managed = await getOrLaunchContext(platformId, { headed: true });
    const page =
      managed.context.pages()[0] ?? (await managed.context.newPage());

    await page.goto(platform.url, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    // Background watch for captcha while user logs in
    void watchConnect(platformId, page).catch((err) => {
      console.error("[browser/connect] watch error:", err);
    });

    return {
      ok: true,
      status: "connecting",
      profilePath: managed.profilePath,
      message:
        "Browser opened (shared profile). Sign in to Google once if needed, then log in to this platform and click “I’ve logged in”.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to open browser";
    await upsertSession(platformId, {
      status: "error",
      lastError: message,
    });
    try {
      await closeContext(platformId);
    } catch {
      /* ignore */
    }
    return {
      ok: false,
      status: "error",
      profilePath: "",
      error: message,
    };
  }
}

async function watchConnect(
  platformId: string,
  page: import("playwright").Page
) {
  const deadline = Date.now() + WATCH_MS;
  while (Date.now() < deadline) {
    if (page.isClosed()) break;
    const captcha = await detectCaptcha(page);
    if (captcha) {
      await upsertSession(platformId, {
        status: "waiting_captcha",
        lastError: "CAPTCHA / challenge detected — solve it in the browser window",
      });
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

export async function confirmPlatformConnect(
  platformId: string
): Promise<ConnectResult> {
  const platform = await db.platform.findUnique({ where: { id: platformId } });
  if (!platform) {
    return {
      ok: false,
      status: "error",
      profilePath: "",
      error: "Platform not found",
    };
  }

  const session = await upsertSession(platformId, {
    status: "connected",
    connectedAt: new Date(),
    lastError: null,
    touchLastUsed: true,
  });

  return {
    ok: true,
    status: "connected",
    profilePath: session.profilePath,
    message: "Session marked connected. Shared profile kept on disk (Google SSO reused).",
  };
}

export async function disconnectPlatform(
  platformId: string
): Promise<ConnectResult> {
  await closeContext(platformId);
  const session = await upsertSession(platformId, {
    status: "disconnected",
    lastError: null,
  });
  return {
    ok: true,
    status: "disconnected",
    profilePath: session.profilePath,
    message: "Browser closed. Shared profile kept — Google login stays for next Connect.",
  };
}
