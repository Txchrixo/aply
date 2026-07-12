/**
 * Paths for local Playwright profiles (never commit .aply/).
 *
 * All Connect / apply flows share one persistent profile (`_shared`) so a
 * single Google login (and other SSO cookies) works across every platform.
 */
import fs from "fs";
import path from "path";

export const SHARED_PROFILE_ID = "_shared";

export function getAplyDataDir(): string {
  const fromEnv = process.env.APLY_DATA_DIR?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(process.cwd(), ".aply");
}

export function getBrowserProfilesRoot(): string {
  return path.join(getAplyDataDir(), "browser-profiles");
}

/** Shared Chromium user-data dir used by every platform Connect/apply. */
export function getSharedProfilePath(): string {
  return path.join(getBrowserProfilesRoot(), SHARED_PROFILE_ID);
}

/**
 * @deprecated Prefer getSharedProfilePath() — kept for callers that still pass platformId.
 * Always returns the shared profile path (best practice for Google SSO reuse).
 */
export function getPlatformProfilePath(_platformId?: string): string {
  return getSharedProfilePath();
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function isBrowserHeaded(): boolean {
  const v = (process.env.APLY_BROWSER_HEADED ?? "true").toLowerCase();
  return v !== "false" && v !== "0" && v !== "no";
}
