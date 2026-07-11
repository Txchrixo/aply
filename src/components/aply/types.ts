/**
 * Shared API response types for the Aply dashboard.
 * Mirrors the JSON shapes returned by /api/* routes.
 */

export interface Stats {
  platformsTotal: number;
  platformsEnabled: number;
  pendingApprovals: number;
  preparedDrafts: number;
  newOffers: number;
  submittedTotal: number;
  rejectedTotal: number;
  pastApps: number;
  monitoringEnabled: boolean;
  scanIntervalMinutes: number;
  languages: string[];
  lastScan: string | null;
}

export interface Platform {
  id: string;
  name: string;
  url: string;
  category: string;
  languages: string[];
  contractTypes: string[];
  hasLoginRequired: boolean;
  hasAntiBot: boolean;
  priority: string;
  notes: string | null;
  enabled: boolean;
  lastCheckedAt: string | null;
  newOffersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformListResponse {
  items: Platform[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface JobOffer {
  id: string;
  externalId: string | null;
  platformId: string;
  title: string;
  company: string | null;
  location: string | null;
  url: string;
  description: string | null;
  contractType: string | null;
  language: string | null;
  salary: string | null;
  postedAt: string | null;
  detectedAt: string;
  status: string;
  /** 0-100, set while the import pipeline runs on a freshly detected offer. */
  importProgress?: number | null;
  /** One of: detecting_fields | generating_letter | filling_form | ready. */
  importStep?: string | null;
  /** career_page | job_board · where Aply will submit this application. */
  applicationSource?: string | null;
  createdAt: string;
  updatedAt: string;
  platform?: Platform;
}

export interface FormField {
  selector: string;
  value: string;
  type: string;
}

export interface Application {
  id: string;
  jobOfferId: string;
  resumeId: string | null;
  coverLetter: string | null;
  formFields: FormField[] | null;
  language: string | null;
  status: string;
  approvalChannel: string | null;
  approvedAt: string | null;
  submittedAt: string | null;
  errorMessage: string | null;
  qualityScore: number | null;
  createdAt: string;
  updatedAt: string;
  jobOffer: JobOffer;
}

export interface ApplicationListResponse {
  items: Application[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface JobListResponse {
  items: JobOffer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Resume {
  id: string;
  label: string;
  rawText: string;
  structured: {
    name?: string;
    title?: string;
    skills?: string[];
    languages?: string[];
    yearsOfExperience?: number;
  } | null;
  language: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeListResponse {
  items: Resume[];
}

export interface PastApplication {
  id: string;
  jobTitle: string;
  company: string | null;
  coverLetter: string;
  outcome: string | null;
  language: string;
  usedAsExample: boolean;
  createdAt: string;
}

export interface PastApplicationListResponse {
  items: PastApplication[];
}

export interface Settings {
  id: string;
  notifyEmail: string | null;
  notifyWhatsapp: string | null;
  notifyChannel: string;
  languages: string[];
  autoApproveThreshold: number;
  monitoringEnabled: boolean;
  scanIntervalMinutes: number;
  antiAiStrictMode: boolean;
  accountEmails: string[];
  preferCareerPage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExtensionInfo {
  name: string;
  version: string;
  manifestUrl: string;
  files: string[];
  installSteps: string[];
  permissions: string[];
}

export interface GenerateResponse {
  coverLetter: string;
  detectedSkills: string[];
  qualityScore: number;
  language: string;
  applicationId?: string;
  error?: string;
}

export interface NotificationPreview {
  channel: string;
  to: string;
  subject: string;
  body: string;
  coverLetterPreview: string;
  jobUrl: string;
}

export interface NotificationResponse {
  ok: boolean;
  preview: NotificationPreview;
}
