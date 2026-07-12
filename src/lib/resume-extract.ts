/**
 * Local PDF / DOCX text extraction (no Z.AI / cloud required).
 *
 * PDF strategy:
 *  1. Inflate FlateDecode streams
 *  2. Parse ToUnicode CMaps (bfchar / bfrange)
 *  3. Map /Fx fonts → ToUnicode via font objects
 *  4. Walk content operators (Tj / TJ / ') with the active font map
 *
 * DOCX: read word/document.xml from the zip.
 */
import { inflateSync, inflateRawSync } from "zlib";

type CMap = Map<number, string>;

function inflatePdfStream(data: Buffer): Buffer | null {
  try {
    return inflateSync(data);
  } catch {
    try {
      return inflateRawSync(data);
    } catch {
      return null;
    }
  }
}

function parseHexCode(hex: string): number {
  return parseInt(hex.replace(/\s+/g, ""), 16);
}

function unicodeFromHex(hex: string): string {
  const clean = hex.replace(/\s+/g, "");
  if (!clean) return "";
  // UTF-16BE code units
  if (clean.length % 4 === 0 && clean.length >= 4) {
    let out = "";
    for (let i = 0; i < clean.length; i += 4) {
      const unit = parseInt(clean.slice(i, i + 4), 16);
      if (unit === 0) continue;
      out += String.fromCharCode(unit);
    }
    return out;
  }
  // byte string fallback
  let out = "";
  for (let i = 0; i < clean.length; i += 2) {
    const code = parseInt(clean.slice(i, i + 2), 16);
    if (!Number.isNaN(code) && code !== 0) out += String.fromCharCode(code);
  }
  return out;
}

function parseToUnicodeCMap(cmapText: string): CMap {
  const map: CMap = new Map();

  const bfchar = /beginbfchar([\s\S]*?)endbfchar/g;
  let block: RegExpExecArray | null;
  while ((block = bfchar.exec(cmapText))) {
    const pairRe = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
    let pair: RegExpExecArray | null;
    while ((pair = pairRe.exec(block[1]))) {
      map.set(parseHexCode(pair[1]), unicodeFromHex(pair[2]));
    }
  }

  const bfrange = /beginbfrange([\s\S]*?)endbfrange/g;
  while ((block = bfrange.exec(cmapText))) {
    // <start> <end> <destStart>
    const rangeRe = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
    let range: RegExpExecArray | null;
    while ((range = rangeRe.exec(block[1]))) {
      const start = parseHexCode(range[1]);
      const end = parseHexCode(range[2]);
      let dest = parseHexCode(range[3]);
      for (let cid = start; cid <= end; cid++) {
        map.set(cid, String.fromCharCode(dest++));
      }
    }
    // <start> <end> [<u1> <u2> ...]
    const arrayRe = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([^\]]+)\]/g;
    while ((range = arrayRe.exec(block[1]))) {
      const start = parseHexCode(range[1]);
      const vals = [...range[3].matchAll(/<([0-9A-Fa-f]+)>/g)].map((m) => unicodeFromHex(m[1]));
      vals.forEach((ch, i) => map.set(start + i, ch));
    }
  }

  return map;
}

function decodePdfStringLiteral(raw: string): string {
  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\(\d{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

function mapCidBytes(hexOrLiteral: string, cmap: CMap | null, isHex: boolean): string {
  if (!cmap || cmap.size === 0) {
    return isHex ? unicodeFromHex(hexOrLiteral) : decodePdfStringLiteral(hexOrLiteral);
  }

  if (isHex) {
    const clean = hexOrLiteral.replace(/\s+/g, "");
    // Prefer 2-byte CIDs (Identity-H)
    if (clean.length % 4 === 0) {
      let out = "";
      for (let i = 0; i < clean.length; i += 4) {
        const cid = parseInt(clean.slice(i, i + 4), 16);
        out += cmap.get(cid) ?? "";
      }
      return out;
    }
    let out = "";
    for (let i = 0; i < clean.length; i += 2) {
      const cid = parseInt(clean.slice(i, i + 2), 16);
      out += cmap.get(cid) ?? String.fromCharCode(cid);
    }
    return out;
  }

  // Literal string: treat each byte as CID (common for single-byte encodings)
  const decoded = decodePdfStringLiteral(hexOrLiteral);
  let out = "";
  for (let i = 0; i < decoded.length; i++) {
    const cid = decoded.charCodeAt(i);
    out += cmap.get(cid) ?? decoded[i];
  }
  return out;
}

function extractTextWithFonts(
  content: string,
  fontMaps: Map<string, CMap>,
  fallback: CMap | null
): string {
  let current: CMap | null = fallback;
  const pieces: string[] = [];

  // Tokenize roughly by tracking Tf and text-showing ops in order
  const opRe =
    /\/([A-Za-z0-9]+)\s+[-0-9.]+\s+Tf|\((?:\\.|[^\\)])*\)\s*(?:Tj|')|<([0-9A-Fa-f\s]+)>\s*(?:Tj|')|\[([\s\S]*?)\]\s*TJ/g;

  let m: RegExpExecArray | null;
  while ((m = opRe.exec(content))) {
    if (m[0].includes(" Tf")) {
      const font = m[1];
      current = fontMaps.get(font) ?? fallback;
      continue;
    }

    if (m[0].endsWith("Tj") || m[0].endsWith("'")) {
      if (m[0].startsWith("<")) {
        pieces.push(mapCidBytes(m[2] || "", current, true));
      } else {
        const lit = m[0].replace(/\s*(?:Tj|')$/, "");
        pieces.push(mapCidBytes(lit.slice(1, -1), current, false));
      }
      continue;
    }

    if (m[0].endsWith("TJ") && m[3] != null) {
      const inner = m[3];
      const parts = inner.match(/\((?:\\.|[^\\)])*\)|<([0-9A-Fa-f\s]+)>/g) || [];
      let line = "";
      for (const p of parts) {
        if (p.startsWith("<")) {
          line += mapCidBytes(p.slice(1, -1), current, true);
        } else {
          line += mapCidBytes(p.slice(1, -1), current, false);
        }
      }
      pieces.push(line);
    }
  }

  return pieces.join("");
}

function collectInflatedStreams(binary: string): Array<{ header: string; content: string }> {
  const out: Array<{ header: string; content: string }> = [];
  const streamRe = /stream\r?\n([\s\S]*?)endstream/g;
  let m: RegExpExecArray | null;
  while ((m = streamRe.exec(binary))) {
    const header = binary.slice(Math.max(0, m.index - 500), m.index);
    if (!/\/FlateDecode/.test(header)) continue;
    let raw = Buffer.from(m[1], "latin1");
    while (raw.length && (raw[0] === 0x0a || raw[0] === 0x0d)) raw = raw.subarray(1);
    const inflated = inflatePdfStream(raw);
    if (!inflated) continue;
    out.push({ header, content: inflated.toString("latin1") });
  }
  return out;
}

/**
 * Extract readable text from a PDF buffer.
 */
export function extractTextFromPdfBuffer(buffer: Buffer): string {
  const binary = buffer.toString("latin1");
  const streams = collectInflatedStreams(binary);

  // Parse all ToUnicode CMaps (indexed by object-ish order + content)
  const cmaps: CMap[] = [];
  for (const s of streams) {
    if (!/beginbfchar|beginbfrange|begincmap/.test(s.content)) continue;
    const cmap = parseToUnicodeCMap(s.content);
    if (cmap.size) cmaps.push(cmap);
  }

  // Map /Fx resource names → cmap by scanning font objects in the raw PDF
  // Example: /F5 ... /ToUnicode 147 0 R   and earlier 147 0 obj ... cmap
  const fontMaps = new Map<string, CMap>();
  const mergedFallback: CMap = new Map();
  for (const cmap of cmaps) {
    for (const [k, v] of cmap) mergedFallback.set(k, v);
  }

  // Build object number → cmap by finding "N 0 obj" before each cmap stream header
  const objCmaps = new Map<number, CMap>();
  for (const s of streams) {
    if (!/begincmap/.test(s.content)) continue;
    const objMatch = s.header.match(/(\d+)\s+0\s+obj[\s\S]*$/);
    if (!objMatch) continue;
    const cmap = parseToUnicodeCMap(s.content);
    if (cmap.size) objCmaps.set(Number(objMatch[1]), cmap);
  }

  // Link resource fonts: /F4 140 0 R inside Font dicts
  const fontResRe = /\/(F\d+)\s+(\d+)\s+0\s+R/g;
  const fontObjToRes = new Map<number, string>();
  let fr: RegExpExecArray | null;
  while ((fr = fontResRe.exec(binary))) {
    fontObjToRes.set(Number(fr[2]), fr[1]);
  }

  // For each font resource object, find its ToUnicode
  for (const [fontObjNum, resName] of fontObjToRes) {
    const objRe = new RegExp(`${fontObjNum}\\s+0\\s+obj([\\s\\S]*?)endobj`);
    const objBody = binary.match(objRe)?.[1];
    if (!objBody) continue;
    const tu = objBody.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
    if (!tu) continue;
    const cmap = objCmaps.get(Number(tu[1]));
    if (cmap) fontMaps.set(resName, cmap);
  }

  // Fallback: if Resources linking failed, still assign cmaps in discovery order to F4/F5...
  if (fontMaps.size === 0 && cmaps.length) {
    const names = [...new Set([...binary.matchAll(/\/(F\d+)\s+\d+\s+0\s+R/g)].map((x) => x[1]))];
    names.forEach((name, i) => {
      fontMaps.set(name, cmaps[Math.min(i, cmaps.length - 1)]);
    });
  }

  // Extract from content streams (large drawing streams with BT/ET)
  const texts: string[] = [];
  for (const s of streams) {
    if (!/BT[\s\S]*?Tj|TJ/.test(s.content)) continue;
    if (/begincmap/.test(s.content)) continue;
    const pageText = extractTextWithFonts(s.content, fontMaps, mergedFallback);
    if (pageText.trim()) texts.push(pageText.trim());
  }

  // Last resort: raw operators without cmap
  if (texts.join("").replace(/\s+/g, "").length < 40) {
    for (const s of streams) {
      if (!/Tj|TJ/.test(s.content) || /begincmap/.test(s.content)) continue;
      texts.push(extractTextWithFonts(s.content, new Map(), null));
    }
  }

  return texts
    .join("\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[^\S\n]{2,}/g, " ")
    .trim();
}

/**
 * Extract plain text from a .docx buffer (OOXML zip).
 */
export function extractTextFromDocxBuffer(bytes: Uint8Array): string {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries: Array<{
    name: string;
    offset: number;
    compressedSize: number;
    compressionMethod: number;
  }> = [];

  for (let i = 0; i < bytes.length - 30; i++) {
    if (view.getUint32(i, true) !== 0x04034b50) continue;
    const compressionMethod = view.getUint16(i + 8, true);
    const compressedSize = view.getUint32(i + 18, true);
    const fileNameLength = view.getUint16(i + 26, true);
    const extraFieldLength = view.getUint16(i + 28, true);
    const name = new TextDecoder().decode(bytes.subarray(i + 30, i + 30 + fileNameLength));
    const dataOffset = i + 30 + fileNameLength + extraFieldLength;
    if (dataOffset + compressedSize > bytes.length) continue;
    entries.push({ name, offset: dataOffset, compressedSize, compressionMethod });
    i = dataOffset + Math.max(compressedSize - 1, 0);
  }

  const docEntry = entries.find((e) => e.name === "word/document.xml");
  if (!docEntry) throw new Error("Could not find document.xml in .docx file");

  const compressedData = bytes.subarray(
    docEntry.offset,
    docEntry.offset + docEntry.compressedSize
  );

  let xml: string;
  if (docEntry.compressionMethod === 0) {
    xml = Buffer.from(compressedData).toString("utf8");
  } else if (docEntry.compressionMethod === 8) {
    xml = inflateRawSync(Buffer.from(compressedData)).toString("utf8");
  } else {
    throw new Error("Unsupported compression in .docx");
  }

  const text = xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
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

  if (!text) throw new Error("No text found in .docx");
  return text;
}
