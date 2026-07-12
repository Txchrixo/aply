/**
 * Shared types for the local browser agent.
 */
export type BrowserSessionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "waiting_captcha"
  | "error";

export type ApplyResult = {
  ok: boolean;
  submitted: boolean;
  filledCount: number;
  captcha: boolean;
  error?: string;
  message?: string;
};

export type ConnectResult = {
  ok: boolean;
  status: BrowserSessionStatus;
  profilePath: string;
  error?: string;
  message?: string;
};

/** Values used to fill application forms in Playwright. */
export type ApplicantProfile = {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;
  location: string;
  coverLetter: string;
  rawText: string;
  /** Absolute path to stored resume file for input[type=file] */
  resumeFilePath: string | null;
  resumeFileName: string | null;
  resumeFileMime: string | null;
};
