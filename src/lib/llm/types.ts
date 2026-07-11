/**
 * LLM Provider abstraction.
 *
 * SOLID: Interface Segregation Principle.
 * Aply should support multiple LLM providers (GLM, OpenAI, Anthropic, local).
 * Each provider implements this interface. The factory creates the right one
 * based on user settings.
 */

export type Language = "en" | "fr" | "de";

export interface CoverLetterInput {
  jobTitle: string;
  company?: string;
  jobDescription: string;
  resumeText: string;
  language: Language;
  pastExamples: string[];
  tone?: "warm" | "concise" | "confident" | "thoughtful";
}

export interface CoverLetterResult {
  coverLetter: string;
  detectedSkills: string[];
  qualityScore: number;
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

export interface JobExtraction {
  title: string;
  company?: string;
  location?: string;
  description: string;
  contractType?: string;
  language: Language;
  detectedSkills: string[];
}

/**
 * The LLM provider interface. Any new provider (OpenAI, Anthropic, local)
 * must implement this. This is the contract the rest of the app depends on.
 */
export interface LLMProvider {
  /** Provider identifier (e.g. "glm", "openai") */
  readonly name: string;

  /** Generate a cover letter draft */
  generateCoverLetter(input: CoverLetterInput): Promise<CoverLetterResult>;

  /** Answer custom form questions based on the resume */
  answerFormQuestions(args: {
    questions: FormQuestion[];
    resumeText: string;
    jobTitle: string;
    company?: string;
    jobDescription: string;
    language: Language;
  }): Promise<FormAnswer[]>;

  /** Extract structured data from a raw job page */
  extractJobFields(rawHtml: string): Promise<JobExtraction>;

  /** Detect the dominant language of a text */
  detectLanguage(text: string): Promise<Language>;
}

/**
 * Provider configuration. Stored in settings.
 */
export interface ProviderConfig {
  provider: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

/**
 * Factory: creates the right LLM provider based on config.
 * Currently only GLM is implemented, but the factory is ready for more.
 */
export async function createLLMProvider(config?: ProviderConfig): Promise<LLMProvider> {
  const providerName = config?.provider ?? process.env.LLM_PROVIDER ?? "glm";

  switch (providerName.toLowerCase()) {
    case "glm":
    default:
      const { GLMProvider } = await import("./providers/glm-provider");
      return new GLMProvider(config);
  }
}
