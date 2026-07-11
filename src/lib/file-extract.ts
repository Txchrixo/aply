/**
 * Client-side file text extraction.
 * Supports: .txt, .md, .csv, .json, .pdf, .docx
 * No external dependencies · uses browser APIs (FileReader, DecompressionStream).
 */

/**
 * Extract text from a plain-text file (.txt, .md, .csv, .json).
 */
async function extractPlainText(file: File): Promise<string> {
  return await file.text();
}

/**
 * Extract text from a PDF file.
 * Parses the raw PDF stream and extracts text from BT...ET blocks.
 * This is a simplified parser · works for most text-based PDFs but won't
 * handle image-only PDFs or complex encodings. Good enough for resumes.
 */
async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  // PDF text is typically Latin-1 encoded inside Tj/TJ operators
  let text = "";
  // Convert to string in chunks (PDFs can be large)
  const chunkSize = 16384;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    text += new TextDecoder("latin1").decode(chunk);
  }

  // Extract text from BT...ET blocks (Begin Text ... End Text)
  const lines: string[] = [];
  // Match text in parentheses within Tj operators: (text) Tj
  const tjRegex = /\(([^)]*)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(text)) !== null) {
    // Unescape PDF string escapes
    const raw = match[1];
    const unescaped = raw
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\");
    lines.push(unescaped);
  }

  // Also try TJ arrays: [(text1) -250 (text2)] TJ
  const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
  while ((match = tjArrayRegex.exec(text)) !== null) {
    const inner = match[1];
    const parts = inner.match(/\(([^)]*)\)/g);
    if (parts) {
      const line = parts
        .map((p) => p.slice(1, -1))
        .join("")
        .replace(/\\n/g, "\n")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")");
      lines.push(line);
    }
  }

  // Clean up: join lines, remove excessive whitespace but preserve newlines
  const result = lines
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!result) {
    throw new Error(
      "Could not extract text from PDF. It may be image-based or encrypted. Try copy-pasting your resume text instead."
    );
  }

  return result;
}

/**
 * Extract text from a .docx file.
 * .docx is a ZIP archive; the text is in word/document.xml.
 * Uses the browser's native DecompressionStream (available in modern browsers).
 */
async function extractDocxText(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    // DecompressionStream supports "deflate-raw" which is what ZIP uses
    const ds = new DecompressionStream("deflate-raw");

    // Parse ZIP structure to find word/document.xml
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    // Find all local file headers (signature 0x04034b50)
    const entries: Array<{ name: string; offset: number; compressedSize: number; compressionMethod: number }> = [];
    for (let i = 0; i < bytes.length - 4; i++) {
      if (view.getUint32(i, true) === 0x04034b50) {
        const compressionMethod = view.getUint16(i + 8, true);
        const compressedSize = view.getUint32(i + 18, true);
        const fileNameLength = view.getUint16(i + 26, true);
        const extraFieldLength = view.getUint16(i + 28, true);
        const name = new TextDecoder().decode(
          bytes.subarray(i + 30, i + 30 + fileNameLength)
        );
        const dataOffset = i + 30 + fileNameLength + extraFieldLength;
        entries.push({ name, offset: dataOffset, compressedSize, compressionMethod });
      }
    }

    const docEntry = entries.find((e) => e.name === "word/document.xml");
    if (!docEntry) {
      throw new Error("Could not find document.xml in .docx file");
    }

    const compressedData = bytes.subarray(
      docEntry.offset,
      docEntry.offset + docEntry.compressedSize
    );

    // Decompress (method 8 = deflate)
    if (docEntry.compressionMethod !== 8) {
      throw new Error("Unsupported compression in .docx");
    }

    const stream = new Blob([compressedData]).stream().pipeThrough(ds);
    const decompressed = await new Response(stream).text();

    // Extract text from XML: w:t elements contain text, w:p marks paragraphs
    const text = decompressed
      .replace(/<w:p[ >]/g, "\n<w:p ")
      .replace(/<w:t[^>]*>/g, "")
      .replace(/<\/w:t>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text) {
      throw new Error("No text found in .docx document.xml");
    }

    return text;
  } catch (err) {
    throw new Error(
      `Failed to parse .docx: ${err instanceof Error ? err.message : "unknown error"}. Try copy-pasting your resume text instead.`
    );
  }
}

/**
 * Main entry point · detect file type and extract text.
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
    return await extractPlainText(file);
  }

  if (name.endsWith(".pdf") || type === "application/pdf") {
    return await extractPdfText(file);
  }

  if (name.endsWith(".docx")) {
    return await extractDocxText(file);
  }

  // Fallback: try reading as text
  try {
    return await file.text();
  } catch {
    throw new Error(
      `Unsupported file type: ${file.name}. Please use .txt, .md, .pdf, or .docx`
    );
  }
}

export const ACCEPTED_FILE_TYPES = ".txt,.md,.csv,.json,.pdf,.docx";
