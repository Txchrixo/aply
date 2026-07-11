/**
 * GET /api/extension/download
 * Returns the Chrome extension as a downloadable ZIP.
 * Uses Node's built-in zlib + a minimal ZIP builder (no external deps).
 */
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { deflateRawSync } from "zlib";

const EXTENSION_DIR = join(process.cwd(), "public", "aply-extension");

const FILES_TO_INCLUDE = [
  "manifest.json",
  "background.js",
  "content.js",
  "popup.html",
  "options.html",
  "README.md",
];

// Minimal ZIP file builder (no external dependency)
// ZIP format: https://en.wikipedia.org/wiki/ZIP_(file_format)
function createZip(files: Array<{ name: string; data: Buffer }>): Buffer {
  const chunks: Buffer[] = [];
  const centralDir: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, "utf8");
    const data = file.data;

    // Compress with deflate
    const compressedData = deflateRawSync(data);
    const crc = crc32(data);

    // Local file header
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(8, 8); // compression method (deflate)
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0, 12); // mod date
    localHeader.writeUInt32LE(crc, 14); // crc32
    localHeader.writeUInt32LE(compressedData.length, 18); // compressed size
    localHeader.writeUInt32LE(data.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26); // filename length
    localHeader.writeUInt16LE(0, 28); // extra field length

    const localHeaderAndData = Buffer.concat([localHeader, nameBuf, compressedData]);
    chunks.push(localHeaderAndData);

    // Central directory header
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // signature
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(8, 10); // compression method
    centralHeader.writeUInt16LE(0, 12); // mod time
    centralHeader.writeUInt16LE(0, 14); // mod date
    centralHeader.writeUInt32LE(crc, 16); // crc32
    centralHeader.writeUInt32LE(compressedData.length, 20); // compressed size
    centralHeader.writeUInt32LE(data.length, 24); // uncompressed size
    centralHeader.writeUInt16LE(nameBuf.length, 28); // filename length
    centralHeader.writeUInt16LE(0, 30); // extra field length
    centralHeader.writeUInt16LE(0, 32); // comment length
    centralHeader.writeUInt16LE(0, 34); // disk number
    centralHeader.writeUInt16LE(0, 36); // internal attrs
    centralHeader.writeUInt32LE(0, 38); // external attrs
    centralHeader.writeUInt32LE(offset, 42); // local header offset

    centralDir.push(Buffer.concat([centralHeader, nameBuf]));
    offset += localHeaderAndData.length;
  }

  const centralDirBuf = Buffer.concat(centralDir);
  const centralDirOffset = offset;
  const centralDirSize = centralDirBuf.length;

  // End of central directory
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0); // signature
  endRecord.writeUInt16LE(0, 4); // disk number
  endRecord.writeUInt16LE(0, 6); // disk with central dir
  endRecord.writeUInt16LE(files.length, 8); // entries on this disk
  endRecord.writeUInt16LE(files.length, 10); // total entries
  endRecord.writeUInt32LE(centralDirSize, 12); // central dir size
  endRecord.writeUInt32LE(centralDirOffset, 16); // central dir offset
  endRecord.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...chunks, centralDirBuf, endRecord]);
}

// CRC32 lookup table
const crcTable: number[] = [];
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c;
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export async function GET() {
  try {
    const files: Array<{ name: string; data: Buffer }> = [];
    for (const name of FILES_TO_INCLUDE) {
      try {
        const data = await readFile(join(EXTENSION_DIR, name));
        files.push({ name, data });
      } catch {
        // skip missing files
      }
    }

    const zip = createZip(files);

    return new NextResponse(zip, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="aply-extension.zip"`,
        "Content-Length": zip.length.toString(),
      },
    });
  } catch (err) {
    console.error("[/api/extension/download] error:", err);
    return NextResponse.json(
      { error: "Failed to create extension ZIP" },
      { status: 500 }
    );
  }
}
