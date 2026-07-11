/**
 * GLM wrapper - DEPRECATED. Use src/lib/llm instead.
 *
 * This file re-exports the new LLM provider abstraction for backward
 * compatibility with existing code that imports from "@/lib/glm".
 *
 * New code should import from "@/lib/llm" directly.
 */
export type { Language, CoverLetterInput, CoverLetterResult, FormQuestion, FormAnswer } from "./llm/types";

import { createLLMProvider } from "./llm/types";
import type { Language, CoverLetterInput, CoverLetterResult, FormQuestion, FormAnswer, JobExtraction } from "./llm/types";

// Singleton provider instance
let _providerPromise: Promise<ReturnType<typeof createLLMProvider>> | null = null;
function getProvider() {
  if (!_providerPromise) _providerPromise = createLLMProvider();
  return _providerPromise;
}

// Backward-compatible exports
export async function generateCoverLetter(input: CoverLetterInput): Promise<CoverLetterResult> {
  const provider = await getProvider();
  return provider.generateCoverLetter(input);
}

export async function answerFormQuestions(args: {
  questions: FormQuestion[];
  resumeText: string;
  jobTitle: string;
  company?: string;
  jobDescription: string;
  language: Language;
}): Promise<FormAnswer[]> {
  const provider = await getProvider();
  return provider.answerFormQuestions(args);
}

export async function extractJobFields(rawHtml: string): Promise<JobExtraction> {
  const provider = await getProvider();
  return provider.extractJobFields(rawHtml);
}

export async function detectLanguage(text: string): Promise<Language> {
  const provider = await getProvider();
  return provider.detectLanguage(text);
}

export function extractSkillsFromResume(resumeText: string): string[] {
  const KNOWN = [
    "TypeScript", "JavaScript", "React", "Next.js", "Node.js", "Prisma",
    "PostgreSQL", "Tailwind", "WebSocket", "Docker", "AWS", "GraphQL",
    "REST", "Python", "Go", "Rust", "Vue", "Angular", "Svelte", "Kubernetes",
  ];
  return KNOWN.filter((s) =>
    new RegExp(`\\b${s.replace(/[.+*?^$()|[\]\\]/g, "\\$&")}\\b`, "i").test(resumeText)
  );
}

export async function scoreQuality(args: {
  coverLetter: string;
  resumeText: string;
  jobDescription: string;
}): Promise<number> {
  // Use the provider's internal scoring via generateCoverLetter's result
  // This is a simplified standalone version
  const { coverLetter, resumeText, jobDescription } = args;
  let score = 0.5;
  const aiTells = [
    "i am writing to express", "delve into", "leverage", "synergy",
    "seamless", "cutting-edge", "passionate about", "thrilled",
  ];
  const lc = coverLetter.toLowerCase();
  const tellHits = aiTells.filter((t) => lc.includes(t)).length;
  score -= tellHits * 0.08;
  const wordCount = coverLetter.trim().split(/\s+/).length;
  if (wordCount >= 90 && wordCount <= 220) score += 0.15;
  if (wordCount < 60 || wordCount > 300) score -= 0.12;
  return Math.max(0.05, Math.min(0.98, score));
}

/**
 * Detect if two job offers are the same job (cross-reference detection).
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
  const wordsA = new Set(titleA.split(" "));
  const wordsB = new Set(titleB.split(" "));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w) && w.length > 2));
  const union = new Set([...wordsA, ...wordsB]);
  const titleScore = union.size > 0 ? intersection.size / union.size : 0;
  let companyScore = 0;
  if (companyA && companyB) {
    if (companyA === companyB) companyScore = 1;
    else if (companyA.includes(companyB) || companyB.includes(companyA)) companyScore = 0.8;
  }
  const locA = normalize(offerA.location ?? "");
  const locB = normalize(offerB.location ?? "");
  let locationScore = 0;
  if (locA && locB) {
    if (locA === locB) locationScore = 1;
    else if (locA.includes(locB) || locB.includes(locA)) locationScore = 0.7;
  }
  const score = companyScore * 0.5 + titleScore * 0.35 + locationScore * 0.15;
  return Math.round(score * 100) / 100;
}
