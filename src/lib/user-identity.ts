/**
 * Name helpers — firstName/lastName are the source of truth (signup).
 * Never invent a greeting from an email local-part.
 */

const SEED_NAMES = new Set([
  "alex",
  "alex martin",
  "alex.martin",
]);

/** Demo / seed identity — never greet the user as this. */
export function isSeedDisplayName(raw?: string | null): boolean {
  const cleaned = (raw ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!cleaned) return false;
  if (SEED_NAMES.has(cleaned)) return true;
  return cleaned === "alex" || cleaned.startsWith("alex martin");
}

function titleCaseToken(token: string): string {
  if (token.length <= 3 && token === token.toUpperCase()) return token;
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

/**
 * Split a full name into firstName / lastName.
 * "Christian Nana" → { firstName: "Christian", lastName: "Nana" }
 */
export function splitFullName(full?: string | null): {
  firstName: string;
  lastName: string;
} {
  const parts = (full ?? "")
    .trim()
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}

/** Normalize a stored first name for greetings. */
export function greetingName(raw?: string | null): string | null {
  const cleaned = (raw ?? "").trim();
  if (!cleaned) return null;
  if (cleaned.includes("@")) return null;
  if (isSeedDisplayName(cleaned)) return null;

  const first =
    cleaned
      .split(/[\s._-]+/)
      .map((p) => p.trim())
      .find((p) => p.length > 0) ?? "";

  if (!first || isSeedDisplayName(first)) return null;
  return titleCaseToken(first);
}

export function greetingLine(name: string): string {
  return `Hi ${name},`;
}

export function nameFromStructured(
  structured?: {
    name?: string | null;
    fullName?: string | null;
    firstName?: string | null;
    contact?: Record<string, string> | null;
  } | null
): string | null {
  if (!structured) return null;
  const contact = structured.contact ?? {};
  const full =
    structured.firstName ||
    structured.fullName ||
    structured.name ||
    contact.firstName ||
    contact.fullName ||
    contact.name ||
    "";
  return greetingName(full);
}

export function nameFromStructuredJson(structuredJson: string | null): string | null {
  if (!structuredJson) return null;
  try {
    return nameFromStructured(
      JSON.parse(structuredJson) as {
        name?: string;
        fullName?: string;
        firstName?: string;
        contact?: Record<string, string>;
      }
    );
  } catch {
    return null;
  }
}
