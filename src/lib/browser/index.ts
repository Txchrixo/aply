/**
 * Local Playwright browser agent for Aply.
 * Shared persistent profile (`_shared`) so Google SSO works across platforms.
 * Authenticated job scrape = phase 2 (not in v1).
 */
export * from "@/lib/browser/types";
export * from "@/lib/browser/paths";
export * from "@/lib/browser/captcha";
export * from "@/lib/browser/manager";
export * from "@/lib/browser/session";
export * from "@/lib/browser/connect";
export * from "@/lib/browser/apply";
export * from "@/lib/browser/profile";
