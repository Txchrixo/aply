/**
 * Aply test suite - verifies that every feature actually works.
 * Run with: bun run tests/run.ts
 *
 * Tests:
 * 1. API endpoints (stats, platforms, companies, jobs, settings, export, digest)
 * 2. GLM cover letter generation (EN/FR) + quality check
 * 3. GLM form question answering (variation handling, EN/FR)
 * 4. Cross-reference detection algorithm
 * 5. Import pipeline (career page preference)
 * 6. Extension ZIP download
 * 7. No em dashes in codebase
 */
const BASE = "http://localhost:3000";
let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    console.log(`  PASS ${name}`);
    passed++;
  } else {
    console.log(`  FAIL ${name}${detail ? " -> " + detail : ""}`);
    failed++;
  }
}

async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function test(name: string, fn: () => Promise<void>) {
  console.log(`\n${name}`);
  try {
    await fn();
  } catch (err) {
    console.log(`  ERROR ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

async function main() {
  console.log("Aply test suite");
  console.log("===============");

  await test("GET /api/stats", async () => {
    const { status, data } = await api("/api/stats");
    assert(status === 200, "returns 200");
    assert(typeof data.platformsTotal === "number", "has platformsTotal");
    assert(data.platformsTotal >= 190, "has 190+ platforms", `got ${data.platformsTotal}`);
  });

  await test("GET /api/platforms", async () => {
    const { status, data } = await api("/api/platforms?page=1&pageSize=5");
    assert(status === 200, "returns 200");
    assert(Array.isArray(data.items), "has items array");
    assert(data.items.length === 5, "returns 5 items", `got ${data.items.length}`);
  });

  await test("GET /api/companies", async () => {
    const { status, data } = await api("/api/companies");
    assert(status === 200, "returns 200");
    assert(data.items.length >= 5, "has 5+ companies", `got ${data.items.length}`);
    const first = data.items[0];
    assert(!!first.careerPages, "company has careerPages");
    if (first.careerPages.length > 0) {
      assert(!!first.careerPages[0].atsSystem, "career page has atsSystem");
    }
  });

  await test("GET /api/jobs/offer-1/details (cross-refs + form reqs)", async () => {
    const { status, data } = await api("/api/jobs/offer-1/details");
    assert(status === 200, "returns 200");
    assert(!!data.company, "has company info");
    assert(data.company.name === "Lumio", "company is Lumio");
    assert(data.crossReferences.length > 0, "has cross-refs", `got ${data.crossReferences.length}`);
    assert(data.formRequirements.length > 0, "has form reqs", `got ${data.formRequirements.length}`);
    assert(!!data.credential, "has credential");
  });

  await test("POST /api/generate (English cover letter)", async () => {
    const { status, data } = await api("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobOfferId: "offer-1" }),
    });
    assert(status === 200, "returns 200");
    assert(!!data.coverLetter, "has cover letter");
    assert(data.coverLetter.length > 100, "substantial letter", `got ${data.coverLetter.length} chars`);
    assert(!data.coverLetter.includes("I am writing to express"), "no AI-tell phrase");
    assert(!data.coverLetter.toLowerCase().includes("delve into"), "no 'delve into'");
    assert(data.qualityScore > 0.5, "quality > 0.5", `got ${data.qualityScore}`);
  });

  await test("POST /api/generate (French cover letter)", async () => {
    const { status, data } = await api("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobOfferId: "offer-2" }),
    });
    assert(status === 200, "returns 200");
    assert(data.language === "fr", "language is fr", `got ${data.language}`);
    assert(
      data.coverLetter.toLowerCase().includes("bonjour") || data.coverLetter.toLowerCase().includes("cordialement"),
      "contains French greetings"
    );
  });

  await test("POST /api/answer-form (English - Indeed questions)", async () => {
    const { status, data } = await api("/api/answer-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobOfferId: "offer-1" }),
    });
    assert(status === 200, "returns 200");
    assert(Array.isArray(data.answers), "has answers");
    assert(data.answers.length > 0, "has answers", `got ${data.answers.length}`);
    const whyAnswer = data.answers.find((a: { fieldKey: string }) => a.fieldKey === "custom_why");
    if (whyAnswer) {
      assert(whyAnswer.answer.length > 20, "why answer substantial", `got ${whyAnswer.answer.length} chars`);
      assert(!whyAnswer.answer.toLowerCase().includes("as an ai"), "no AI disclaimer");
    }
  });

  await test("POST /api/answer-form (French - WTTJ questions)", async () => {
    const { status, data } = await api("/api/answer-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobOfferId: "offer-2" }),
    });
    assert(status === 200, "returns 200");
    assert(data.language === "fr", "language is fr");
    const expAnswer = data.answers.find((a: { fieldKey: string }) => a.fieldKey === "custom_experience");
    if (expAnswer) {
      assert(expAnswer.answer.length > 30, "experience answer substantial", `got ${expAnswer.answer.length} chars`);
    }
  });

  await test("detectCrossReference() algorithm", async () => {
    const { detectCrossReference } = await import("../src/lib/glm");
    const score1 = detectCrossReference(
      { title: "Senior Frontend Engineer", company: "Lumio", location: "Remote" },
      { title: "Senior Frontend Engineer", company: "Lumio", location: "Remote" }
    );
    assert(score1 === 1, "identical offers = 1.0", `got ${score1}`);

    const score2 = detectCrossReference(
      { title: "Senior Frontend Engineer", company: "Lumio", location: "Remote" },
      { title: "Frontend Engineer (Senior)", company: "Lumio", location: "Remote - EU" }
    );
    assert(score2 > 0.5, "similar title same company > 0.5", `got ${score2}`);

    const score3 = detectCrossReference(
      { title: "Senior Frontend Engineer", company: "Lumio", location: "Remote" },
      { title: "Senior Frontend Engineer", company: "Forge", location: "Remote" }
    );
    assert(score3 <= 0.5, "different company <= 0.5", `got ${score3}`);

    const score4 = detectCrossReference(
      { title: "Backend Developer", company: "Acme", location: "Paris" },
      { title: "Sales Manager", company: "Globex", location: "Berlin" }
    );
    assert(score4 < 0.2, "completely different < 0.2", `got ${score4}`);
  });

  await test("POST /api/jobs/[id]/import (import pipeline)", async () => {
    const { status, data } = await api("/api/jobs/offer-3/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    assert(status === 200, "returns 200");
    assert(data.ok === true, "ok is true");
    assert(data.offer.importProgress === 100, "progress = 100", `got ${data.offer.importProgress}`);
    assert(data.offer.importStep === "ready", "step = ready", `got ${data.offer.importStep}`);
    assert(!!data.source, "has source determination");
    assert(!!data.source.reason, "has source reason");
  });

  await test("POST /api/scan (monitoring scan)", async () => {
    const { status, data } = await api("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    assert(status === 200, "returns 200");
    assert(data.ok === true, "ok is true");
    assert(typeof data.scannedCount === "number", "has scannedCount");
    assert(Array.isArray(data.newOffers), "has newOffers");
  });

  await test("GET /api/extension/download (ZIP)", async () => {
    const res = await fetch(`${BASE}/api/extension/download`);
    assert(res.status === 200, "returns 200");
    assert(res.headers.get("content-type") === "application/zip", "content-type is zip");
    const buf = await res.arrayBuffer();
    assert(buf.byteLength > 1000, "ZIP > 1KB", `got ${buf.byteLength} bytes`);
    const bytes = new Uint8Array(buf);
    assert(bytes[0] === 0x50 && bytes[1] === 0x4b, "has ZIP magic bytes (PK)");
  });

  await test("GET /api/settings (accountEmails)", async () => {
    const { status, data } = await api("/api/settings");
    assert(status === 200, "returns 200");
    assert(Array.isArray(data.accountEmails), "has accountEmails");
    assert(data.accountEmails.length >= 2, "2+ emails", `got ${data.accountEmails.length}`);
    assert(typeof data.preferCareerPage === "boolean", "has preferCareerPage");
  });

  await test("GET /api/export?format=csv", async () => {
    const res = await fetch(`${BASE}/api/export?format=csv`);
    assert(res.status === 200, "returns 200");
    assert(res.headers.get("content-type")?.includes("text/csv"), "content-type is csv");
    const text = await res.text();
    assert(text.includes("Date,Status,Job Title"), "has CSV headers");
    assert(text.includes("\n"), "has data rows");
  });

  await test("GET /api/digest", async () => {
    const { status, data } = await api("/api/digest");
    assert(status === 200, "returns 200");
    assert(!!data.stats, "has stats");
    assert(typeof data.stats.scans === "number", "has scan count");
    assert(!!data.email, "has email preview");
    assert(!!data.email.subject, "has email subject");
  });

  await test("No em dashes in codebase", async () => {
    const { readdirSync, readFileSync, statSync } = await import("fs");
    const { join } = await import("path");
    let emDashCount = 0;
    function scan(dir: string) {
      for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry === ".next" || entry === ".git" || entry === "skills") continue;
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) scan(full);
        else if (full.endsWith(".ts") || full.endsWith(".tsx") || full.endsWith(".js") || full.endsWith(".css")) {
          const content = readFileSync(full, "utf8");
          const matches = content.match(/—/g);
          if (matches) emDashCount += matches.length;
        }
      }
    }
    scan(join(process.cwd(), "src"));
    assert(emDashCount === 0, "no em dashes in src/", `found ${emDashCount}`);
  });

  console.log("\n" + "=".repeat(50));
  console.log(`${passed} passed, ${failed} failed`);
  console.log("=".repeat(50));
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
