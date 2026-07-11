/**
 * GLM Provider - implements LLMProvider using z-ai-web-dev-sdk.
 *
 * This is the default provider. It wraps the existing GLM logic
 * but behind the LLMProvider interface so it can be swapped out.
 */
import ZAI from "z-ai-web-dev-sdk";
import type {
  LLMProvider,
  ProviderConfig,
  Language,
  CoverLetterInput,
  CoverLetterResult,
  FormQuestion,
  FormAnswer,
  JobExtraction,
} from "../types";

const LANG_NAME: Record<Language, string> = {
  en: "English",
  fr: "French",
  de: "German",
};

const LANG_NATIVE: Record<Language, string> = {
  en: "English",
  fr: "francais",
  de: "Deutsch",
};

// AI-tell phrases to avoid
const AI_TELLS = [
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
  "par la presente",
  "faites appel a mes services",
];

const KNOWN_SKILLS = [
  "TypeScript", "JavaScript", "React", "Next.js", "Node.js", "Prisma",
  "PostgreSQL", "Tailwind", "WebSocket", "Docker", "AWS", "GraphQL",
  "REST", "Python", "Go", "Rust", "Vue", "Angular", "Svelte", "Kubernetes",
  "CI/CD", "Testing", "Playwright", "Vitest", "Accessibility", "Design System",
  "Figma", "Postgres", "SQLite", "Redis", "Kafka", "gRPC", "Microservices",
];

function extractSkillsFromResume(resumeText: string): string[] {
  return KNOWN_SKILLS.filter((s) =>
    new RegExp(`\\b${s.replace(/[.+*?^$()|[\]\\]/g, "\\$&")}\\b`, "i").test(resumeText)
  );
}

export class GLMProvider implements LLMProvider {
  readonly name = "glm";
  private clientPromise: Promise<InstanceType<typeof ZAI>> | null = null;

  constructor(private config?: ProviderConfig) {}

  private async getClient(): Promise<InstanceType<typeof ZAI>> {
    const apiKey = this.config?.apiKey ?? process.env.ZAI_API_KEY;
    if (apiKey) {
      return new ZAI({
        baseUrl: this.config?.baseUrl ?? "https://api.z.ai/api/paas/v4",
        apiKey,
      });
    }
    if (!this.clientPromise) {
      // @ts-expect-error - create() is a static method
      this.clientPromise = ZAI.create();
    }
    return this.clientPromise;
  }

  async generateCoverLetter(input: CoverLetterInput): Promise<CoverLetterResult> {
    const client = await this.getClient();
    const tone = input.tone ?? "warm";

    const systemPrompt = `You are Aply's cover-letter writer. You write job applications on behalf of the candidate that are INDISTINGUISHABLE from human writing.

NON-NEGOTIABLE RULES:
1. Write in ${LANG_NAME[input.language]} (${LANG_NATIVE[input.language]}).
2. ONLY cite skills, experiences, or achievements from the candidate's resume. Never invent facts.
3. NEVER use these AI-tell phrases: "I am writing to express", "delve into", "leverage", "synergy", "seamless", "cutting-edge", "passionate about", "thrilled".
4. Vary sentence length. Open with something specific to THIS job.
5. Include ONE warm, slightly informal aside.
6. Max 220 words. Sign off naturally.
7. Output ONLY the cover letter. No preamble, no markdown.`;

    const userPrompt = `# JOB OFFER
Title: ${input.jobTitle}
Company: ${input.company ?? "N/A"}
Description: ${input.jobDescription}

# CANDIDATE'S RESUME
${input.resumeText}

# STYLE REFERENCES
${input.pastExamples.length > 0 ? input.pastExamples.map((e, i) => `--- Example ${i + 1} ---\n${e}`).join("\n\n") : "(no examples)"}

# TONE: ${tone}

Write the cover letter now. ${LANG_NATIVE[input.language]} only.`;

    const completion = await client.chat.completions.create({
      model: this.config?.model ?? "glm-4.6",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.78,
      top_p: 0.92,
      thinking: { type: "disabled" },
    });

    const coverLetter: string = completion?.choices?.[0]?.message?.content?.trim() ?? "";
    const detectedSkills = extractSkillsFromResume(input.resumeText).filter((s) =>
      coverLetter.toLowerCase().includes(s.toLowerCase())
    );
    const qualityScore = await this.scoreQuality({
      coverLetter,
      resumeText: input.resumeText,
      jobDescription: input.jobDescription,
    });

    return { coverLetter, detectedSkills, qualityScore };
  }

  private async scoreQuality(args: {
    coverLetter: string;
    resumeText: string;
    jobDescription: string;
  }): Promise<number> {
    const { coverLetter, resumeText, jobDescription } = args;
    let score = 0.5;
    const lc = coverLetter.toLowerCase();
    const tellHits = AI_TELLS.filter((t) => lc.includes(t)).length;
    score -= tellHits * 0.08;

    const wordCount = coverLetter.trim().split(/\s+/).length;
    if (wordCount >= 90 && wordCount <= 220) score += 0.15;
    if (wordCount < 60 || wordCount > 300) score -= 0.12;

    const resumeSkills = extractSkillsFromResume(resumeText);
    const backed = resumeSkills.filter((s) => lc.includes(s.toLowerCase())).length;
    score += Math.min(backed * 0.04, 0.2);

    const jobTokens = jobDescription.toLowerCase().split(/[^a-z0-9+#./-]+/i).filter((t) => t.length >= 4 && t.length <= 22);
    const overlap = jobTokens.filter((t) => lc.includes(t)).length;
    if (overlap >= 3) score += 0.1;

    return Math.max(0.05, Math.min(0.98, score));
  }

  async answerFormQuestions(args: {
    questions: FormQuestion[];
    resumeText: string;
    jobTitle: string;
    company?: string;
    jobDescription: string;
    language: Language;
  }): Promise<FormAnswer[]> {
    const { questions, resumeText, jobTitle, company, jobDescription, language } = args;
    if (questions.length === 0) return [];

    const client = await this.getClient();
    const questionsJson = JSON.stringify(
      questions.map((q) => ({
        key: q.fieldKey, label: q.fieldLabel, type: q.fieldType,
        required: q.isRequired, options: q.options ?? undefined,
      }))
    );

    const systemPrompt = `You are Aply's form-filling assistant. Answer job application questions on behalf of the candidate.

RULES:
1. Answer in ${LANG_NAME[language]}.
2. ONLY use facts from the resume. Never invent.
3. For "select" fields, pick EXACTLY one option.
4. For "text", 1-3 sentences. For "textarea", 3-6 sentences.
5. NEVER say "as an AI". Always answer as the candidate.

Respond with ONLY a JSON array: [{"key":"<fieldKey>","answer":"<answer>"}]. No markdown.`;

    const userPrompt = `# JOB
Title: ${jobTitle}
Company: ${company ?? "N/A"}
Description: ${jobDescription.slice(0, 1000)}

# RESUME
${resumeText.slice(0, 3000)}

# QUESTIONS
${questionsJson}

Answer each question. JSON array only.`;

    try {
      const completion = await client.chat.completions.create({
        model: this.config?.model ?? "glm-4.6",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
        thinking: { type: "disabled" },
      });

      const raw = completion?.choices?.[0]?.message?.content?.trim() ?? "[]";
      const clean = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(clean) as Array<{ key: string; answer: string }>;

      return parsed.map((p) => ({
        fieldKey: p.key,
        fieldLabel: questions.find((q) => q.fieldKey === p.key)?.fieldLabel ?? p.key,
        answer: p.answer,
      }));
    } catch (err) {
      console.error("[GLMProvider.answerFormQuestions] error:", err);
      return questions.map((q) => ({ fieldKey: q.fieldKey, fieldLabel: q.fieldLabel, answer: "" }));
    }
  }

  async extractJobFields(rawHtml: string): Promise<JobExtraction> {
    const client = await this.getClient();
    const completion = await client.chat.completions.create({
      model: this.config?.model ?? "glm-4.6",
      messages: [
        {
          role: "system",
          content: `You extract structured data from a job offer web page. Respond ONLY with a compact JSON object. Keys: title, company, location, description (max 600 chars), contractType, language (en|fr|de), detectedSkills (max 12).`,
        },
        { role: "user", content: `Raw page content:\n\n${rawHtml.slice(0, 8000)}` },
      ],
      temperature: 0.2,
      thinking: { type: "disabled" },
    });

    const raw = completion?.choices?.[0]?.message?.content?.trim() ?? "{}";
    try {
      return JSON.parse(raw);
    } catch {
      return { title: "Untitled position", description: rawHtml.slice(0, 600), language: "en", detectedSkills: [] };
    }
  }

  async detectLanguage(text: string): Promise<Language> {
    const client = await this.getClient();
    try {
      const completion = await client.chat.completions.create({
        model: this.config?.model ?? "glm-4.6",
        messages: [
          { role: "system", content: `Respond with one word: "en", "fr", or "de".` },
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
}
