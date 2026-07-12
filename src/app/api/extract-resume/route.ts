/**
 * POST /api/extract-resume
 * Body: { file: base64, filename, mimeType? }
 *
 * Local-first resume text extraction for .txt / .md / .pdf / .docx.
 * Uses zlib-based PDF stream decoding — no Z.AI config required.
 * Optional VLM fallback only if ZAI_API_KEY is set.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  extractTextFromDocxBuffer,
  extractTextFromPdfBuffer,
} from "@/lib/resume-extract";

async function extractPdfTextViaVLM(base64: string): Promise<string> {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "This PDF has little/no extractable text (likely a scanned image). Set ZAI_API_KEY for OCR fallback, or export a text-based PDF."
    );
  }

  const ZAI = (await import("z-ai-web-dev-sdk")).default;
  const client = new ZAI({
    baseUrl: process.env.ZAI_BASE_URL ?? "https://api.z.ai/api/paas/v4",
    apiKey,
  });

  const completion = await client.chat.completions.createVision({
    model: "glm-4.5v",
    messages: [
      {
        role: "system",
        content:
          "You are a resume parser. Extract ALL text from the resume exactly as written. Output ONLY the plain text, preserving structure. Do not summarize.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract all text from this resume. Output the full text content only." },
          { type: "file_url", file_url: { url: `data:application/pdf;base64,${base64}` } },
        ],
      },
    ],
    thinking: { type: "disabled" },
  });

  const text = completion?.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text || text.length < 10) throw new Error("VLM could not extract text");
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { file: base64, filename } = body;
    if (!base64 || !filename) {
      return NextResponse.json(
        { error: "file (base64) and filename are required" },
        { status: 400 }
      );
    }

    const name = String(filename).toLowerCase();
    const buffer = Buffer.from(base64, "base64");
    const bytes = new Uint8Array(buffer);

    if (
      name.endsWith(".txt") ||
      name.endsWith(".md") ||
      name.endsWith(".csv") ||
      name.endsWith(".json")
    ) {
      return NextResponse.json({ text: buffer.toString("utf8") });
    }

    if (name.endsWith(".pdf") || body.mimeType === "application/pdf") {
      try {
        const localText = extractTextFromPdfBuffer(buffer);
        if (localText && localText.replace(/\s+/g, " ").trim().length >= 40) {
          return NextResponse.json({ text: localText, method: "local-pdf" });
        }
      } catch (err) {
        console.warn("[/api/extract-resume] local PDF parse failed:", err);
      }

      try {
        const vlmText = await extractPdfTextViaVLM(base64);
        return NextResponse.json({ text: vlmText, method: "vlm" });
      } catch (err) {
        return NextResponse.json(
          {
            error:
              "Could not extract text from PDF. " +
              (err instanceof Error ? err.message : "Unknown error"),
          },
          { status: 422 }
        );
      }
    }

    if (name.endsWith(".docx")) {
      try {
        const text = extractTextFromDocxBuffer(bytes);
        return NextResponse.json({ text, method: "local-docx" });
      } catch (err) {
        return NextResponse.json(
          {
            error:
              "Could not extract text from .docx. " +
              (err instanceof Error ? err.message : ""),
          },
          { status: 422 }
        );
      }
    }

    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  } catch (err) {
    console.error("[/api/extract-resume] error:", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
