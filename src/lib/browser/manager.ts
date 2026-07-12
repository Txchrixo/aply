/**
 * In-process Playwright context manager.
 * One shared persistent profile (`_shared`) for all platforms — Google SSO once.
 * Contexts live in the Next.js Node process — keep the server running while browsing.
 */
import { chromium, type BrowserContext } from "playwright";
import {
  ensureDir,
  getSharedProfilePath,
  isBrowserHeaded,
  SHARED_PROFILE_ID,
} from "@/lib/browser/paths";

type Managed = {
  context: BrowserContext;
  /** Always the shared profile id for the open context */
  profileId: string;
  profilePath: string;
  /** Platforms that currently expect this browser (for UI “open” badges) */
  activePlatformIds: Set<string>;
};

let shared: Managed | null = null;

function isContextAlive(context: BrowserContext): boolean {
  try {
    context.pages();
    return true;
  } catch {
    return false;
  }
}

export async function getOrLaunchContext(
  platformId: string,
  opts?: { headed?: boolean }
): Promise<{
  context: BrowserContext;
  platformId: string;
  profilePath: string;
}> {
  if (shared && isContextAlive(shared.context)) {
    shared.activePlatformIds.add(platformId);
    return {
      context: shared.context,
      platformId,
      profilePath: shared.profilePath,
    };
  }

  shared = null;

  const profilePath = getSharedProfilePath();
  ensureDir(profilePath);
  const headed = opts?.headed ?? isBrowserHeaded();

  let context: BrowserContext;
  try {
    context = await chromium.launchPersistentContext(profilePath, {
      headless: !headed,
      channel: "chrome",
      viewport: { width: 1280, height: 900 },
      chromiumSandbox: true,
      args: ["--disable-blink-features=AutomationControlled"],
    });
  } catch {
    context = await chromium.launchPersistentContext(profilePath, {
      headless: !headed,
      viewport: { width: 1280, height: 900 },
      chromiumSandbox: true,
      args: ["--disable-blink-features=AutomationControlled"],
    });
  }

  const activePlatformIds = new Set<string>([platformId]);
  shared = {
    context,
    profileId: SHARED_PROFILE_ID,
    profilePath,
    activePlatformIds,
  };

  context.on("close", () => {
    if (shared?.context === context) shared = null;
  });

  return { context, platformId, profilePath };
}

export function getOpenContext(platformId: string): {
  context: BrowserContext;
  platformId: string;
  profilePath: string;
} | null {
  if (!shared || !isContextAlive(shared.context)) return null;
  return {
    context: shared.context,
    platformId,
    profilePath: shared.profilePath,
  };
}

export function isSharedBrowserOpen(): boolean {
  return Boolean(shared && isContextAlive(shared.context));
}

/**
 * Close the shared browser. Profile on disk is kept (Google session persists).
 * `platformId` is accepted for API symmetry; closing always shuts the shared window.
 */
export async function closeContext(_platformId?: string): Promise<void> {
  const managed = shared;
  shared = null;
  if (!managed) return;
  try {
    await managed.context.close();
  } catch {
    /* already closed */
  }
}

export function listOpenPlatformIds(): string[] {
  if (!shared || !isContextAlive(shared.context)) return [];
  return [...shared.activePlatformIds];
}

export function getSharedProfilePathForApi(): string {
  return getSharedProfilePath();
}
