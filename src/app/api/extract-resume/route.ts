/**
 * POST /api/extract-resume
 * Body: { file: base64, filename, mimeType }
 *
 * Server-side resume text extraction.
 * Handles: .txt, .md, .csv, .json (plain text), .pdf (text + VLM fallback), .docx
 *
 * The VLM fallback for image-based PDFs uses z-ai-web-dev-sdk server-side.
 * This route exists so the client never imports the SDK.
 */
import { NextRequest, NextResponse } from "next/server";
import { deflateRawSync } from "zlib";

function extractPdfText(text: string): { result: string | null } {
  const lines: string[] = [];
  const tjRegex = /\(([^)]*)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(text)) !== null) {
    const raw = match[1];
    const unescaped = raw
      .replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t")
      .replace(/\\\(/g, "(").replace(/\\\)/g, ")").replace(/\\\\/g, "\\");
    lines.push(unescaped);
  }
  const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
  while ((match = tjArrayRegex.exec(text)) !== null) {
    const inner = match[1];
    const parts = inner.match(/\(([^)]*)\)/g);
    if (parts) {
      const line = parts.map((p) => p.slice(1, -1)).join("")
        .replace(/\\n/g, "\n").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
      lines.push(line);
    }
  }
  const result = lines.join("\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return { result: result || null };
}

async function extractPdfTextViaVLM(base64: string): Promise<string> {
  const ZAI = (await import("z-ai-web-dev-sdk")).default;
  let client: InstanceType<typeof ZAI>;
  const apiKey = process.env.ZAI_API_KEY;
  if (apiKey) {
    client = new ZAI({ baseUrl: process.env.ZAI_BASE_URL ?? "https://api.z.ai/api/paas/v4", apiKey });
  } else {
    // @ts-expect-error - create() is static
    client = await ZAI.create();
  }
  const completion = await client.chat.completions.createVision({
    model: "glm-4.5v",
    messages: [
      { role: "system", content: "You are a resume parser. Extract ALL text from the resume exactly as written. Output ONLY the plain text, preserving structure. Do not summarize." },
      { role: "user", content: [
        { type: "text", text: "Extract all text from this resume. Output the full text content only." },
        { type: "file_url", file_url: { url: `data:application/pdf;base64,${base64}` } },
      ] },
    ],
    thinking: { type: "disabled" },
  });
  const text = completion?.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text || text.length < 10) throw new Error("VLM could not extract text");
  return text;
}

function extractDocxText(bytes: Uint8Array): string {
  const view = new DataView(bytes.buffer);
  const entries: Array<{ name: string; offset: number; compressedSize: number; compressionMethod: number }> = [];
  for (let i = 0; i < bytes.length - 4; i++) {
    if (view.getUint32(i, true) === 0x04034b50) {
      const compressionMethod = view.getUint16(i + 8, true);
      const compressedSize = view.getUint32(i + 18, true);
      const fileNameLength = view.getUint16(i + 26, true);
      const extraFieldLength = view.getUint16(i + 28, true);
      const name = new TextDecoder().decode(bytes.subarray(i + 30, i + 30 + fileNameLength));
      const dataOffset = i + 30 + fileNameLength + extraFieldLength;
      entries.push({ name, offset: dataOffset, compressedSize, compressionMethod });
    }
  }
  const docEntry = entries.find((e) => e.name === "word/document.xml");
  if (!docEntry) throw new Error("Could not find document.xml in .docx file");
  const compressedData = bytes.subarray(docEntry.offset, docEntry.offset + docEntry.compressedSize);
  if (docEntry.compressionMethod !== 8) throw new Error("Unsupported compression in .docx");
  const decompressed = deflateRawSync(Buffer.from(compressedData));
  const text = decompressed.toString("utf8")
    .replace(/<w:p[ >]/g, "\n<w:p ").replace(/<w:t[^>]*>/g, "").replace(/<\/w:t>/g, "")
    .replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) throw new Error("No text found in .docx document.xml");
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { file: base64, filename } = body;
    if (!base64 || !filename) {
      return NextResponse.json({ error: "file (base64) and filename are required" }, { status: 400 });
    }

    const name = filename.toLowerCase();
    const buffer = Buffer.from(base64, "base64");
    const bytes = new Uint8Array(buffer);

    if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv") || name.endsWith(".json")) {
      return NextResponse.json({ text: buffer.toString("utf8") });
    }

    if (name.endsWith(".pdf")) {
      const text = new TextDecoder("latin1").decode(bytes);
      const { result } = extractPdfText(text);
      if (result) return NextResponse.json({ text: result });
      try {
        const vlmText = await extractPdfTextViaVLM(base64);
        return NextResponse.json({ text: vlmText });
      } catch (err) {
        return NextResponse.json({
          error: "Could not extract text from PDF. " + (err instanceof Error ? err.message : ""),
        }, { status: 422 });
      }
    }

    if (name.endsWith(".docx")) {
      try {
        const text = extractDocxText(bytes);
        return NextResponse.json({ text });
      } catch (err) {
        return NextResponse.json({
          error: "Could not extract text from .docx. " + (err instanceof Error ? err.message : ""),
        }, { status: 422 });
      }
    }

    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  } catch (err) {
    console.error("[/api/extract-resume] error:", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
