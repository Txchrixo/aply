/**
 * Persist BrowserSession rows for UI + apply gating.
 */
import { db } from "@/lib/db";
import { getSharedProfilePath, ensureDir } from "@/lib/browser/paths";
import type { BrowserSessionStatus } from "@/lib/browser/types";

export async function upsertSession(
  platformId: string,
  data: {
    status: BrowserSessionStatus;
    lastError?: string | null;
    connectedAt?: Date | null;
    touchLastUsed?: boolean;
  }
) {
  const profilePath = getSharedProfilePath();
  ensureDir(profilePath);

  return db.browserSession.upsert({
    where: { platformId },
    create: {
      platformId,
      status: data.status,
      profilePath,
      lastError: data.lastError ?? null,
      connectedAt: data.connectedAt ?? null,
      lastUsedAt: data.touchLastUsed ? new Date() : null,
    },
    update: {
      status: data.status,
      profilePath,
      lastError: data.lastError === undefined ? undefined : data.lastError,
      connectedAt:
        data.connectedAt === undefined ? undefined : data.connectedAt,
      lastUsedAt: data.touchLastUsed ? new Date() : undefined,
    },
  });
}

export async function getSession(platformId: string) {
  return db.browserSession.findUnique({
    where: { platformId },
    include: { platform: true },
  });
}

export async function listSessions() {
  return db.browserSession.findMany({
    include: {
      platform: {
        select: {
          id: true,
          name: true,
          url: true,
          hasLoginRequired: true,
          category: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function isPlatformReadyToApply(platformId: string): Promise<{
  ok: boolean;
  reason?: string;
  requiresLogin: boolean;
}> {
  const platform = await db.platform.findUnique({ where: { id: platformId } });
  if (!platform) return { ok: false, reason: "Platform not found", requiresLogin: true };
  if (!platform.hasLoginRequired) {
    return { ok: true, requiresLogin: false };
  }
  const session = await getSession(platformId);
  if (!session || session.status !== "connected") {
    return {
      ok: false,
      requiresLogin: true,
      reason: "Connect this platform first (login required)",
    };
  }
  return { ok: true, requiresLogin: true };
}
