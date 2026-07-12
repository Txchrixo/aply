/**
 * Lightweight token auth for the Chrome extension.
 * Local-first: any email/password signs in (same as the demo login UI).
 * Tokens are HMAC-signed so the extension can call APIs with Authorization.
 */
import { createHmac, timingSafeEqual } from "crypto";

const SECRET =
  process.env.APLY_EXTENSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "aply-local-dev-secret";

export type ExtensionSession = {
  email: string;
  issuedAt: number;
};

function sign(payloadB64: string): string {
  return createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
}

export function createExtensionToken(email: string): string {
  const payload: ExtensionSession = {
    email: email.trim().toLowerCase(),
    issuedAt: Date.now(),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyExtensionToken(token: string | null | undefined): ExtensionSession | null {
  if (!token) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const expected = sign(payloadB64);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as ExtensionSession;
    if (!payload?.email || typeof payload.issuedAt !== "number") return null;
    // 90 days
    if (Date.now() - payload.issuedAt > 90 * 24 * 60 * 60 * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

export function requireExtensionAuth(req: Request): ExtensionSession | null {
  return verifyExtensionToken(getBearerToken(req));
}
