/**
 * Client-side file text extraction utility.
 *
 * For plain text files (.txt, .md, .csv, .json): reads directly.
 * For PDF and DOCX: sends the file to /api/extract-resume (server-side)
 * so the z-ai-web-dev-sdk is never imported in the browser.
 */

export const ACCEPTED_FILE_TYPES = ".txt,.md,.csv,.json,.pdf,.docx";

/**
 * Extract text from a file.
 * - Plain text files: read directly on the client.
 * - PDF/DOCX: POST to /api/extract-resume (server handles SDK + VLM).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const type = file.type;

  // Plain text: read directly
  if (
    name.endsWith(".txt") || name.endsWith(".md") ||
    name.endsWith(".csv") || name.endsWith(".json") ||
    type === "text/plain" || type === "text/markdown"
  ) {
    return await file.text();
  }

  // PDF or DOCX: send to server
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

  // Fallback: try as text
  try {
    return await file.text();
  } catch {
    throw new Error(`Unsupported file type: ${file.name}. Use .txt, .md, .pdf, or .docx`);
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:application/pdf;base64,")
      const base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
