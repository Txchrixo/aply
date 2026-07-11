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

export interface FormQuestion {
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  isRequired: boolean;
  options?: string[] | null;
  placeholder?: string | null;
}

export interface FormAnswer {
  fieldKey: string;
  fieldLabel: string;
  answer: string;
}

/**
 * Answer custom form questions using GLM + the user's resume.
 *
 * This handles the variation problem: different job boards ask for different
 * info (education history, professional experience entries, "why this job",
 * salary expectations, work authorization, etc.). GLM reads the resume and
 * generates authentic, specific answers for each question.
 *
 * For select fields with options, GLM picks the best matching option.
 * For text/textarea fields, GLM generates a full answer grounded in the resume.
 */
export async function answerFormQuestions(args: {
  questions: FormQuestion[];
  resumeText: string;
  jobTitle: string;
  company?: string;
  jobDescription: string;
  language: Language;
}): Promise<FormAnswer[]> {
  const { questions, resumeText, jobTitle, company, jobDescription, language } = args;
  if (questions.length === 0) return [];

  const client = await getClientAsync();

  const questionsJson = JSON.stringify(
    questions.map((q) => ({
      key: q.fieldKey,
      label: q.fieldLabel,
      type: q.fieldType,
      required: q.isRequired,
      options: q.options ?? undefined,
    }))
  );

  const systemPrompt = `You are Aply's form-filling assistant. You answer job application questions on behalf of the candidate.

RULES:
1. Answer in ${LANG_NAME[language]}.
2. ONLY use facts from the candidate's resume. Never invent employers, dates, degrees, or metrics.
3. For "select" fields with options, respond with EXACTLY one of the provided options (the best match).
4. For "text" fields, give a concise answer (1-3 sentences max).
5. For "textarea" fields, give a fuller answer (3-6 sentences) but stay grounded in the resume.
6. For "tel" / "email" / "date" fields, give a simple value.
7. For questions like "Why are you interested?", reference something specific from the job description.
8. For salary questions, say "negotiable" or give a range based on the role seniority if the resume hints at it.
9. NEVER say "as an AI" or "I cannot" · always answer as the candidate.

Respond with ONLY a JSON array. Each element: {"key": "<fieldKey>", "answer": "<your answer>"}. No markdown, no explanation.`;

  const userPrompt = `# JOB
Title: ${jobTitle}
Company: ${company ?? "N/A"}
Description: ${jobDescription.slice(0, 1000)}

# CANDIDATE RESUME
${resumeText.slice(0, 3000)}

# QUESTIONS TO ANSWER
${questionsJson}

# TASK
Answer each question. JSON array only.`;

  try {
    const completion = await client.chat.completions.create({
      model: "glm-4.6",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      thinking: { type: "disabled" },
    });

    const raw = completion?.choices?.[0]?.message?.content?.trim() ?? "[]";
    // Strip markdown code fences if present
    const clean = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(clean) as Array<{ key: string; answer: string }>;

    return parsed.map((p) => ({
      fieldKey: p.key,
      fieldLabel: questions.find((q) => q.fieldKey === p.key)?.fieldLabel ?? p.key,
      answer: p.answer,
    }));
  } catch (err) {
    console.error("[answerFormQuestions] GLM error:", err);
    // Fallback: return empty answers for required fields
    return questions.map((q) => ({
      fieldKey: q.fieldKey,
      fieldLabel: q.fieldLabel,
      answer: "",
    }));
  }
}

/**
 * Detect if two job offers are the same job (cross-reference detection).
 * Compares title similarity + company name + location.
 * Returns a confidence score 0-1.
 */
export function detectCrossReference(
  offerA: { title: string; company?: string | null; location?: string | null },
  offerB: { title: string; company?: string | null; location?: string | null }
): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  const titleA = normalize(offerA.title);
  const titleB = normalize(offerB.title);
  const companyA = normalize(offerA.company ?? "");
  const companyB = normalize(offerB.company ?? "");

  // Title similarity (word overlap)
  const wordsA = new Set(titleA.split(" "));
  const wordsB = new Set(titleB.split(" "));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w) && w.length > 2));
  const union = new Set([...wordsA, ...wordsB]);
  const titleScore = union.size > 0 ? intersection.size / union.size : 0;

  // Company match (exact or contains)
  let companyScore = 0;
  if (companyA && companyB) {
    if (companyA === companyB) companyScore = 1;
    else if (companyA.includes(companyB) || companyB.includes(companyA)) companyScore = 0.8;
    else companyScore = 0;
  }

  // Location match
  const locA = normalize(offerA.location ?? "");
  const locB = normalize(offerB.location ?? "");
  let locationScore = 0;
  if (locA && locB) {
    if (locA === locB) locationScore = 1;
    else if (locA.includes(locB) || locB.includes(locA)) locationScore = 0.7;
  }

  // Weighted score: company is most important, then title, then location
  const score = companyScore * 0.5 + titleScore * 0.35 + locationScore * 0.15;
  return Math.round(score * 100) / 100;
}
