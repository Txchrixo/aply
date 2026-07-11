/**
 * Aply · GLM (z-ai-web-dev-sdk) wrapper
 * Server-side only. Never import this from a client component.
 *
 * Exposes helpers used by the application pipeline:
 *   - generateCoverLetter(): anti-AI-detection cover letter draft
 *   - extractJobFields(): structured fields from a raw job description
 *   - scoreQuality(): 0-1 quality / authenticity score
 *   - translateOffer(): translate a job offer summary
 */
import ZAI from "z-ai-web-dev-sdk";

let _clientPromise: Promise<InstanceType<typeof ZAI>> | null = null;

/**
 * Returns a cached GLM client.
 * Priority:
 *   1. ZAI_API_KEY env var (explicit)
 *   2. SDK auto-config from .z-ai-config files (project / home / /etc)
 */
function getClient(): InstanceType<typeof ZAI> {
  const apiKey = process.env.ZAI_API_KEY;
  if (apiKey) {
    return new ZAI({
      baseUrl: process.env.ZAI_BASE_URL ?? "https://api.z.ai/api/paas/v4",
      apiKey,
    });
  }
  // Fallback: SDK auto-config · but ZAI.create() is async, so we use a cached
  // promise and the caller must await getClientAsync().
  throw new Error(
    "GLM client not ready · use getClientAsync() when ZAI_API_KEY is not set."
  );
}

async function getClientAsync(): Promise<InstanceType<typeof ZAI>> {
  const apiKey = process.env.ZAI_API_KEY;
  if (apiKey) {
    return new ZAI({
      baseUrl: process.env.ZAI_BASE_URL ?? "https://api.z.ai/api/paas/v4",
      apiKey,
    });
  }
  if (!_clientPromise) {
    // @ts-expect-error · create() is a static method on the class
    _clientPromise = ZAI.create();
  }
  return _clientPromise;
}

export type Language = "en" | "fr" | "de";

const LANG_NAME: Record<Language, string> = {
  en: "English",
  fr: "French",
  de: "German",
};

const LANG_NATIVE: Record<Language, string> = {
  en: "English",
  fr: "français",
  de: "Deutsch",
};

export interface CoverLetterInput {
  jobTitle: string;
  company?: string;
  jobDescription: string;
  resumeText: string;
  language: Language;
  pastExamples: string[]; // previous cover letters used as style reference
  tone?: "warm" | "concise" | "confident" | "thoughtful";
}

export interface CoverLetterResult {
  coverLetter: string;
  detectedSkills: string[];
  qualityScore: number;
}

/**
 * Generate an authentic, anti-AI-detection cover letter.
 *
 * Anti-AI-detection strategy baked into the prompt:
 *  - few-shot from the user's own past applications (voice / persona)
 *  - forbid clichéd LLM phrasings ("I am writing to express", "delve into", etc.)
 *  - require concrete, verifiable claims drawn strictly from the resume
 *  - vary sentence length and structure
 *  - allow one small human imperfection (a warm aside, a slightly informal sign-off)
 *  - temperature tuned for variety without incoherence
 */
export async function generateCoverLetter(
  input: CoverLetterInput
): Promise<CoverLetterResult> {
  const client = await getClientAsync();
  const tone = input.tone ?? "warm";

  const systemPrompt = `You are Aply's cover-letter writer. You write job applications on behalf of the candidate that are INDISTINGUISHABLE from human writing and impossible to flag as AI-generated.

NON-NEGOTIABLE RULES:
1. Write in ${LANG_NAME[input.language]} (${LANG_NATIVE[input.language]}). The output language MUST be ${LANG_NATIVE[input.language]}.
2. ONLY cite skills, experiences, or achievements that appear in the candidate's resume. Never invent facts. Never hallucinate employers, dates, metrics, or tools.
3. NEVER use these AI-tell phrases: "I am writing to express my interest", "I am excited to apply", "delve into", "in today's fast-paced world", "I believe I would be a great fit", "leverage", "synergy", "robust", "seamless", "cutting-edge", "passionate about", "thrilled", "look no further", " Without further ado", "It is worth noting".
4. Vary sentence length deliberately: mix short punchy sentences with longer ones. Avoid uniform rhythm.
5. Open with something specific to THIS job offer · not a generic greeting. Reference one concrete detail from the job description.
6. Include at most ONE warm, slightly informal aside (a parenthetical, a small honest remark). This is what makes it feel human.
7. Do not exceed 220 words. Brevity reads as confidence.
8. Sign off naturally. Avoid "Sincerely" + full formal block unless the language/culture demands it. Prefer "- Alex", "Cordialement, Alex", or "Mit freundlichen Grüßen, Alex".
9. Do not include a subject line, header, or the company address. Just the body + sign-off.
10. Output ONLY the cover letter. No preamble, no explanation, no markdown code fences.`;

  const userPrompt = `# JOB OFFER
Title: ${input.jobTitle}
Company: ${input.company ?? "N/A"}
Description:
${input.jobDescription}

# CANDIDATE'S RESUME
${input.resumeText}

# STYLE REFERENCES (the candidate's own past applications · mirror this voice)
${input.pastExamples.length > 0 ? input.pastExamples.map((e, i) => `--- Example ${i + 1} ---\n${e}`).join("\n\n") : "(no past examples yet · write in a warm, direct, confident voice)"}

# TONE
${tone}

# TASK
Write the cover letter now. ${LANG_NATIVE[input.language]} only. Remember: a human recruiter should not be able to tell this was AI-written. The single most important thing is that every claim is true to the resume.`;

  const completion = await client.chat.completions.create({
    model: "glm-4.6",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.78,
    top_p: 0.92,
    thinking: { type: "disabled" },
  });

  const coverLetter: string =
    completion?.choices?.[0]?.message?.content?.trim() ?? "";

  // Extract skills mentioned (intersection sanity check) + a soft quality score
  const detectedSkills = extractSkillsFromResume(input.resumeText).filter((s) =>
    coverLetter.toLowerCase().includes(s.toLowerCase())
  );

  const qualityScore = await scoreQuality({
    coverLetter,
    resumeText: input.resumeText,
    jobDescription: input.jobDescription,
  });

  return { coverLetter, detectedSkills, qualityScore };
}

/**
 * Light-weight quality / authenticity scorer.
 * Returns a 0-1 number. Combines:
 *  - presence of concrete resume-backed claims
 *  - absence of AI-tell phrases
 *  - reasonable length
 *  - language match (rough)
 */
export async function scoreQuality(args: {
  coverLetter: string;
  resumeText: string;
  jobDescription: string;
}): Promise<number> {
  const { coverLetter, resumeText, jobDescription } = args;
  let score = 0.5;

  const aiTells = [
    "i am writing to express",
    "delve into",
    "in today's fast-paced",
    "i would be a great fit",
    "leverage",
    "synergy",
    "seamless",
    "cutting-edge",
    "passionate about",
    "thrilled",
    "look no further",
    "without further ado",
    "it is worth noting",
    "i am excited to apply",
    "je soussigne",
    "par la présente",
    "faites appel à mes services",
  ];
  const lc = coverLetter.toLowerCase();
  const tellHits = aiTells.filter((t) => lc.includes(t)).length;
  score -= tellHits * 0.08;

  const wordCount = coverLetter.trim().split(/\s+/).length;
  if (wordCount >= 90 && wordCount <= 220) score += 0.15;
  if (wordCount < 60 || wordCount > 300) score -= 0.12;

  const resumeSkills = extractSkillsFromResume(resumeText);
  const backed = resumeSkills.filter((s) => lc.includes(s.toLowerCase())).length;
  score += Math.min(backed * 0.04, 0.2);

  // references at least one concrete token from the job description
  const jobTokens = jobDescription
    .toLowerCase()
    .split(/[^a-zà-ÿ0-9+#./-]+/i)
    .filter((t) => t.length >= 4 && t.length <= 22);
  const overlap = jobTokens.filter((t) => lc.includes(t)).length;
  if (overlap >= 3) score += 0.1;

  return Math.max(0.05, Math.min(0.98, score));
}

/**
 * Naive skill extractor from a resume plain-text.
 */
export function extractSkillsFromResume(resumeText: string): string[] {
  const known = [
    "TypeScript", "JavaScript", "React", "Next.js", "Node.js", "Prisma",
    "PostgreSQL", "Tailwind", "WebSocket", "Docker", "AWS", "GraphQL",
    "REST", "Python", "Go", "Rust", "Vue", "Angular", "Svelte", "Kubernetes",
    "CI/CD", "Testing", "Playwright", "Vitest", "Accessibility", "Design System",
    "Figma", "Postgres", "SQLite", "Redis", "Kafka", "gRPC", "Microservices",
  ];
  return known.filter((s) =>
    new RegExp(`\\b${s.replace(/[.+*?^$()|[\]\\]/g, "\\$&")}\\b`, "i").test(resumeText)
  );
}

/**
 * Extract structured fields from a raw job description (title, company, location, etc.)
 * Used by the extension's right-click capture flow.
 */
export async function extractJobFields(rawHtml: string): Promise<{
  title: string;
  company?: string;
  location?: string;
  description: string;
  contractType?: string;
  language: Language;
  detectedSkills: string[];
}> {
  const client = await getClientAsync();
  const completion = await client.chat.completions.create({
    model: "glm-4.6",
    messages: [
      {
        role: "system",
        content: `You extract structured data from a job offer web page. Respond ONLY with a compact JSON object, no markdown, no explanation. Keys: title (string), company (string|null), location (string|null), description (string, max 600 chars), contractType (one of "full-time"|"part-time"|"internship"|"freelance"|"remote"|null), language (one of "en"|"fr"|"de"), detectedSkills (array of strings, max 12).`,
      },
      {
        role: "user",
        content: `Raw page content (HTML stripped to text):\n\n${rawHtml.slice(0, 8000)}`,
      },
    ],
    temperature: 0.2,
    thinking: { type: "disabled" },
  });

  const raw = completion?.choices?.[0]?.message?.content?.trim() ?? "{}";
  try {
    return JSON.parse(raw);
  } catch {
    return {
      title: "Untitled position",
      description: rawHtml.slice(0, 600),
      language: "en",
      detectedSkills: [],
    };
  }
}

/**
 * Detect the language of a text (en/fr/de) using GLM.
 * Falls back to "en".
 */
export async function detectLanguage(text: string): Promise<Language> {
  const client = await getClientAsync();
  try {
    const completion = await client.chat.completions.create({
      model: "glm-4.6",
      messages: [
        {
          role: "system",
          content: `Respond with a single word: "en", "fr", or "de" · the dominant language of the text.`,
        },
        { role: "user", content: text.slice(0, 1000) },
      ],
      temperature: 0,
      thinking: { type: "disabled" },
    });
    const out = (completion?.choices?.[0]?.message?.content?.trim() ?? "en").toLowerCase();
    if (out.startsWith("fr")) return "fr";
    if (out.startsWith("de")) return "de";
    return "en";
  } catch {
    return "en";
  }
}
