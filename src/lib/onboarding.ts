/** Demo seed resume — UI placeholder only, never treated as real user data. */
export const RESUME_PLACEHOLDER = `Alex Martin · Senior Full-Stack Engineer

EXPERIENCE
Senior Full-Stack Engineer · Acme Corp (2021–present)
- Led migration of a monolith to Next.js 16 + TypeScript, cutting TTI by 38%.
- Built a real-time collaboration feature with WebSocket/socket.io used by 12k DAU.
- Mentored 4 juniors; introduced trunk-based dev and reduced deploy time by 60%.

Full-Stack Developer · Beta Studio (2018–2021)
- Shipped 20+ client web apps with React, Node, Prisma, PostgreSQL.
- Designed an internal design system adopted across 7 product teams.

EDUCATION
M.Sc. Computer Science · EPITA, Paris (2018)

SKILLS
TypeScript, React, Next.js, Node.js, Prisma, PostgreSQL, Tailwind, shadcn/ui,
WebSocket, Docker, AWS, CI/CD, REST, GraphQL, testing (Vitest/Playwright).

LANGUAGES
French (native), English (C1), German (B2).

ABOUT
I care about craft, accessibility, and shipping software that feels human.
I write prose the way I write code: clear, intentional, and a little warm.`;

const SEED_EMAILS = new Set([
  "alex.martin@example.com",
  "alex.careers@gmail.com",
  "alex.applications@proton.me",
]);

export function isSeedResume(text: string | null | undefined): boolean {
  if (!text?.trim()) return true;
  const t = text.trim();
  return (
    t.includes("Alex Martin · Senior Full-Stack Engineer") ||
    t.includes("Alex Martin · Senior Full-Stack") ||
    (t.includes("Acme Corp (2021") && t.includes("Beta Studio (2018"))
  );
}

export function isSeedEmail(email: string): boolean {
  return SEED_EMAILS.has(email.trim().toLowerCase());
}

export function sanitizeOnboardingEmails(emails: string[]): string[] {
  return emails
    .map((e) => e.trim())
    .filter((e) => e && !isSeedEmail(e));
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
