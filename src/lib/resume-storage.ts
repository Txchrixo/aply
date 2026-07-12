/**
 * Persist original resume files under .aply/resumes/ for form uploads.
 */
import fs from "fs";
import path from "path";
import { getAplyDataDir, ensureDir } from "@/lib/browser/paths";

export function getResumesDir(): string {
  return path.join(getAplyDataDir(), "resumes");
}

function safeExt(filename: string, mime?: string | null): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf") || mime === "application/pdf") return ".pdf";
  if (lower.endsWith(".docx")) return ".docx";
  if (lower.endsWith(".doc")) return ".doc";
  if (lower.endsWith(".txt")) return ".txt";
  if (lower.endsWith(".md")) return ".md";
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return ".docx";
  }
  return path.extname(lower) || ".bin";
}

export function mimeForFilename(filename: string, mime?: string | null): string {
  if (mime && mime !== "application/octet-stream") return mime;
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".txt") || lower.endsWith(".md")) return "text/plain";
  return "application/octet-stream";
}

/** Write buffer to disk; returns absolute path stored on the Resume row. */
export function saveResumeFile(
  resumeId: string,
  filename: string,
  buffer: Buffer,
  mime?: string | null
): { filePath: string; fileName: string; fileMime: string } {
  const dir = getResumesDir();
  ensureDir(dir);
  const ext = safeExt(filename, mime);
  const dest = path.join(dir, `${resumeId}${ext}`);
  // Remove previous variant with a different extension
  for (const existing of fs.readdirSync(dir)) {
    if (existing.startsWith(`${resumeId}.`) && path.join(dir, existing) !== dest) {
      try {
        fs.unlinkSync(path.join(dir, existing));
      } catch {
        /* ignore */
      }
    }
  }
  fs.writeFileSync(dest, buffer);
  return {
    filePath: dest,
    fileName: path.basename(filename) || `resume${ext}`,
    fileMime: mimeForFilename(filename, mime),
  };
}

export function deleteResumeFile(filePath: string | null | undefined): void {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    /* ignore */
  }
}

export function readResumeFile(
  filePath: string | null | undefined
): Buffer | null {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}

export function resumeHasFile(resume: {
  filePath: string | null;
  fileName?: string | null;
}): boolean {
  return Boolean(resume.filePath && readResumeFile(resume.filePath));
}
