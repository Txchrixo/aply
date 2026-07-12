/**
 * Client-side file text extraction utility.
 *
 * For plain text files (.txt, .md, .csv, .json): reads directly.
 * For PDF and DOCX: sends the file to /api/extract-resume (server-side
 * local parser — FlateDecode + ToUnicode for PDF, OOXML for DOCX).
 *
 * Prefer uploadResumeFile() when you want the original file kept for
 * application form uploads.
 */

export const ACCEPTED_FILE_TYPES = ".txt,.md,.csv,.json,.pdf,.docx";

export type UploadedResume = {
  id: string;
  rawText: string;
  label: string;
  fileName: string | null;
  hasFile: boolean;
};

/**
 * Extract text from a file.
 * - Plain text files: read directly on the client.
 * - PDF/DOCX: POST to /api/extract-resume (local server-side extraction).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".csv") ||
    name.endsWith(".json") ||
    type === "text/plain" ||
    type === "text/markdown"
  ) {
    return await file.text();
  }

  if (name.endsWith(".pdf") || name.endsWith(".docx") || type === "application/pdf") {
    const base64 = await fileToBase64(file);
    const res = await fetch("/api/extract-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: base64,
        filename: file.name,
        mimeType: file.type,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Extraction failed");
    }
    return data.text;
  }

  try {
    return await file.text();
  } catch {
    throw new Error(
      `Unsupported file type: ${file.name}. Use .txt, .md, .pdf, or .docx`
    );
  }
}

/**
 * Upload resume file: extract text + persist original for form attachments.
 */
export async function uploadResumeFile(file: File): Promise<UploadedResume> {
  const base64 = await fileToBase64(file);
  const res = await fetch("/api/resume/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file: base64,
      filename: file.name,
      mimeType: file.type,
      label: file.name.replace(/\.[^.]+$/, ""),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Upload failed");
  }
  return {
    id: data.id,
    rawText: data.rawText,
    label: data.label,
    fileName: data.fileName ?? file.name,
    hasFile: Boolean(data.hasFile),
  };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
