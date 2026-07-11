/**
 * Aply seed script
 * - Inserts the 193 curated platforms (idempotent upsert by name)
 * - Seeds a default user resume, a few past applications (style training)
 * - Seeds default settings
 * - Seeds a handful of demo job offers + pending applications for the dashboard
 */
import { PrismaClient } from "@prisma/client";
import { SEED_PLATFORMS } from "../src/lib/platforms-data";

const db = new PrismaClient();

async function main() {
  console.log("→ Seeding platforms…");
  let platformCount = 0;
  for (const p of SEED_PLATFORMS) {
    await db.platform.upsert({
      where: { name: p.name },
      update: {
        url: p.url,
        category: p.category,
        languages: JSON.stringify(p.languages),
        contractTypes: JSON.stringify(p.contractTypes),
        hasLoginRequired: p.hasLoginRequired,
        hasAntiBot: p.hasAntiBot,
        priority: p.priority,
        notes: p.notes ?? null,
      },
      create: {
        name: p.name,
        url: p.url,
        category: p.category,
        languages: JSON.stringify(p.languages),
        contractTypes: JSON.stringify(p.contractTypes),
        hasLoginRequired: p.hasLoginRequired,
        hasAntiBot: p.hasAntiBot,
        priority: p.priority,
        notes: p.notes ?? null,
        enabled: true,
      },
    });
    platformCount++;
  }
  console.log(`  ✓ ${platformCount} platforms upserted`);

  // ---- Default resume ----
  console.log("→ Seeding default resume…");
  const resume = await db.resume.upsert({
    where: { id: "resume-default" },
    update: {},
    create: {
      id: "resume-default",
      label: "Main resume",
      language: "en",
      isDefault: true,
      rawText: `Alex Martin · Senior Full-Stack Engineer

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
I write prose the way I write code: clear, intentional, and a little warm.`,
    structured: JSON.stringify({
      name: "Alex Martin",
      title: "Senior Full-Stack Engineer",
      skills: [
        "TypeScript", "React", "Next.js", "Node.js", "Prisma",
        "PostgreSQL", "Tailwind", "WebSocket", "Docker", "AWS",
      ],
      languages: ["fr", "en", "de"],
      yearsOfExperience: 6,
    }),
    },
  });

  // ---- Past applications (style training examples) ----
  console.log("→ Seeding past applications (training data)…");
  const pastApps = [
    {
      id: "past-1",
      jobTitle: "Senior Frontend Engineer",
      company: "Lumio",
      language: "en",
      outcome: "accepted",
      coverLetter: `Hi Lumio team,

Reading your job post, the part about "building interfaces that feel like they read your mind" struck me · that's exactly the bar I hold myself to.

At Acme Corp I led the rewrite of a 6-year-old frontend into Next.js + TypeScript, and the moment I'm proudest of wasn't the 38% TTI cut · it was a support ticket that read "the app finally feels fast in a way I can't explain." That's the kind of polish I'd bring to Lumio.

I'm particularly drawn to your design-system work; at Beta Studio I shipped an internal system adopted by 7 product teams, and I learned that the best components are the ones nobody notices.

Happy to walk you through concrete examples. Thanks for reading.

- Alex`,
    },
    {
      id: "past-2",
      jobTitle: "Développeur Full-Stack (React/Node)",
      company: "ParisLab",
      language: "fr",
      outcome: "accepted",
      coverLetter: `Bonjour l'équipe ParisLab,

Votre offre mentionne un produit utilisé par les hôpitaux · c'est exactement le genre d'impact qui me motive.

J'ai passé les trois dernières années chez Acme Corp à migrer un monolithe vers Next.js 16, et ce que j'ai appris au-delà de la techno, c'est l'importance d'un code lisible par les juniors. J'encadrais 4 personnes et nous avons réduit le temps de déploiement de 60%.

Côté stack, je suis très à l'aise avec React, Node, Prisma et PostgreSQL. Je parle aussi couramment français (langue maternelle), ce qui me semble utile dans un contexte hospitalier français.

Je serais ravi d'échanger sur la suite.

Cordialement,
Alex`,
    },
    {
      id: "past-3",
      jobTitle: "Frontend Entwickler (m/w/d)",
      company: "BerlinTech GmbH",
      language: "de",
      outcome: "no_answer",
      coverLetter: `Sehr geehrte BerlinTech-Teams,

Ihre Stellenanzeige hat mich angesprochen, weil Sie Wert auf saubere Architektur und Accessibility legen · zwei Themen, die mir am Herzen liegen.

Bei Acme Corp habe ich ein Designsystem aufgebaut, das von 7 Teams übernommen wurde. Ich spreche B2-Deutsch und lebe in Frankreich, bin aber offen für Remote-Zusammenarbeit.

Gerne erzähle ich mehr in einem kurzen Gespräch.

Mit freundlichen Grüßen,
Alex`,
    },
  ];
  for (const pa of pastApps) {
    await db.pastApplication.upsert({
      where: { id: pa.id },
      update: {},
      create: pa,
    });
  }
  console.log(`  ✓ ${pastApps.length} past applications seeded`);

  // ---- Default settings ----
  console.log("→ Seeding default settings…");
  await db.setting.upsert({
    where: { id: "aply" },
    update: {},
    create: {
      id: "aply",
      notifyEmail: "alex.martin@example.com",
      notifyWhatsapp: "+33 6 12 34 56 78",
      notifyChannel: "both",
      languages: JSON.stringify(["en", "fr", "de"]),
      monitoringEnabled: true,
      scanIntervalMinutes: 15,
      antiAiStrictMode: true,
      autoApproveThreshold: 0,
      accountEmails: JSON.stringify([
        "alex.martin@example.com",
        "alex.careers@gmail.com",
        "alex.applications@proton.me",
      ]),
      preferCareerPage: true,
    },
  });

  // ---- Companies + career pages ----
  console.log("→ Seeding companies + career pages…");
  const companies = [
    { name: "Lumio", website: "https://lumio.com", industry: "SaaS", size: "medium", linkedinUrl: "https://linkedin.com/company/lumio", atsSystem: "greenhouse" },
    { name: "ParisLab", website: "https://parislab.fr", industry: "Healthtech", size: "startup", linkedinUrl: "https://linkedin.com/company/parislab", atsSystem: "lever" },
    { name: "BerlinTech GmbH", website: "https://berlintech.de", industry: "Fintech", size: "medium", linkedinUrl: "https://linkedin.com/company/berlintech", atsSystem: "workday" },
    { name: "Driftwood Co.", website: "https://driftwood.co", industry: "Productivity", size: "startup", linkedinUrl: "https://linkedin.com/company/driftwood", atsSystem: "ashby" },
    { name: "Forge", website: "https://forge.dev", industry: "DevTools", size: "medium", linkedinUrl: "https://linkedin.com/company/forge-dev", atsSystem: "greenhouse" },
  ];
  const companyMap: Record<string, string> = {};
  for (const c of companies) {
    const created = await db.company.upsert({
      where: { name: c.name },
      update: {},
      create: {
        name: c.name,
        website: c.website,
        industry: c.industry,
        size: c.size,
        linkedinUrl: c.linkedinUrl,
      },
    });
    companyMap[c.name] = created.id;
    // Career page
    const careerUrl = c.website.replace(/\/$/, "") + "/careers";
    await db.companyCareerPage.upsert({
      where: { id: `cp-${c.name}` },
      update: {},
      create: {
        id: `cp-${c.name}`,
        companyId: created.id,
        url: careerUrl,
        atsSystem: c.atsSystem,
        jobsBoardUrl: c.atsSystem === "greenhouse" ? `https://boards.greenhouse.io/${c.name.toLowerCase()}` : c.atsSystem === "lever" ? `https://jobs.lever.co/${c.name.toLowerCase()}` : null,
        enabled: true,
      },
    });
  }
  console.log(`  ✓ ${companies.length} companies + career pages seeded`);

  // ---- Demo job offers + pending applications ----
  console.log("→ Seeding demo job offers + pending applications…");
  const indeed = await db.platform.findUnique({ where: { name: "Indeed" } });
  const linkedin = await db.platform.findUnique({ where: { name: "LinkedIn Jobs" } });
  const weworkremotely = await db.platform.findUnique({ where: { name: "We Work Remotely" } });
  const welcometothejungle = await db.platform.findUnique({ where: { name: "Welcome to the Jungle" } });
  const upwork = await db.platform.findUnique({ where: { name: "Upwork" } });

  const demoOffers = [
    {
      id: "offer-1",
      platformName: indeed?.name,
      title: "Senior Frontend Engineer (React/Next.js)",
      company: "Lumio",
      location: "Remote · Europe",
      url: "https://www.indeed.com/viewjob?jk=demo1",
      contractType: "remote",
      language: "en",
      salary: "$95k–$120k",
      description: `We're Lumio, a Series B product building interfaces that feel like they read your mind. We need a Senior Frontend Engineer with deep React/Next.js experience to own our design system and push our app's performance. Accessibility is non-negotiable. TypeScript required.`,
      status: "pending_approval",
    },
    {
      id: "offer-2",
      platformName: welcometothejungle?.name,
      title: "Développeur Full-Stack H/F",
      company: "ParisLab",
      location: "Paris 11e · hybride",
      url: "https://www.welcometothejungle.com/companies/parislab/jobs/demo2",
      contractType: "full-time",
      language: "fr",
      salary: "55k€–65k€",
      description: `ParisLab construit un logiciel utilisé par les hôpitaux pour optimiser le parcours patient. On cherche un dev Full-Stack React/Node pour rejoindre une équipe de 6. Stack: Next.js, Prisma, PostgreSQL. Sens du produit et esprit d'équipe indispensables.`,
      status: "pending_approval",
    },
    {
      id: "offer-3",
      platformName: weworkremotely?.name,
      title: "Full-Stack Engineer · Remote, anywhere",
      company: "Driftwood Co.",
      location: "Remote (worldwide)",
      url: "https://weworkremotely.com/remote-jobs/demo3",
      contractType: "remote",
      language: "en",
      salary: "$80k–$110k",
      description: `Driftwood is a small fully-remote team building a calmer email client. We're looking for our 4th engineer. You'll work across the stack: Next.js, Postgres, a bit of infra. We value clear writing, async communication, and shipping small things often.`,
      status: "pending_approval",
    },
    {
      id: "offer-4",
      platformName: upwork?.name,
      title: "Need a Next.js expert for a 3-month dashboard project",
      company: "Northwind Analytics",
      location: "Remote",
      url: "https://www.upwork.com/jobs/demo4",
      contractType: "freelance",
      language: "en",
      salary: "$60–$80/hr",
      description: `Looking for a senior Next.js + TypeScript freelancer to build an internal analytics dashboard over ~3 months. Must be comfortable with Prisma, Recharts, and design systems. Start in 2 weeks.`,
      status: "prepared",
    },
    {
      id: "offer-5",
      platformName: linkedin?.name,
      title: "Frontend Entwickler (m/w/d) · Remote",
      company: "BerlinTech GmbH",
      location: "Berlin / Remote (DACH)",
      url: "https://www.linkedin.com/jobs/view/demo5",
      contractType: "full-time",
      language: "de",
      salary: "65k€–80k€",
      description: `BerlinTech sucht eine/n Frontend-Entwickler/in mit Erfahrung in React und TypeScript. Fokus auf Accessibility und saubere Architektur. Remote innerhalb DACH möglich. Deutsch B2+ erwünscht.`,
      status: "new",
    },
  ];

  for (const o of demoOffers) {
    if (!o.platformName) continue;
    const platform = await db.platform.findUnique({ where: { name: o.platformName } });
    if (!platform) continue;
    const offer = await db.jobOffer.upsert({
      where: { id: o.id },
      update: {},
      create: {
        id: o.id,
        platformId: platform.id,
        companyId: companyMap[o.company] ?? null,
        title: o.title,
        company: o.company,
        location: o.location,
        url: o.url,
        description: o.description,
        contractType: o.contractType,
        language: o.language,
        salary: o.salary,
        postedAt: new Date(Date.now() - Math.random() * 3 * 24 * 3600 * 1000),
        status: o.status,
        applicationSource: o.platformName === indeed?.name || o.platformName === welcometothejungle?.name ? "job_board" : "job_board",
      },
    });

    // Create cross-reference: the same job on the company career page
    if (companyMap[o.company]) {
      const careerOfferId = `career-${o.id}`;
      await db.jobOffer.upsert({
        where: { id: careerOfferId },
        update: {},
        create: {
          id: careerOfferId,
          companyId: companyMap[o.company],
          title: o.title,
          company: o.company,
          location: o.location,
          url: `https://${o.company.toLowerCase().replace(/\s+/g, "")}.com/careers/${o.id}`,
          description: o.description,
          contractType: o.contractType,
          language: o.language,
          salary: o.salary,
          postedAt: new Date(Date.now() - Math.random() * 3 * 24 * 3600 * 1000),
          status: "new",
          applicationSource: "career_page",
        },
      });
      await db.offerCrossReference.upsert({
        where: { id: `xref-${o.id}` },
        update: {},
        create: {
          id: `xref-${o.id}`,
          primaryOfferId: o.id,
          aliasOfferId: careerOfferId,
          source: "career_page",
          url: `https://${o.company.toLowerCase().replace(/\s+/g, "")}.com/careers/${o.id}`,
          confidence: 0.92,
        },
      });
    }

    // For pending ones, create a draft application with a generated-style cover letter
    if (o.status === "pending_approval" || o.status === "prepared") {
      const draftLetter =
        o.language === "fr"
          ? `Bonjour l'équipe ${o.company},\n\nVotre offre résonne particulièrement avec ce que je cherche. J'ai passé les dernières années à migrer un monolithe vers Next.js 16 + TypeScript, avec un focus sur la performance et l'accessibilité · deux sujets qui me semblent centraux pour ${o.company}.\n\nJe serais ravi d'en discuter.\n\nCordialement,\nAlex`
          : o.language === "de"
          ? `Sehr geehrte ${o.company}-Teams,\n\nIhre Anzeige spricht mich an. Ich habe Erfahrung mit React, TypeScript und Accessibility und bringe B2-Deutschkenntnisse mit.\n\nGerne zum Gespräch bereit.\n\nMit freundlichen Grüßen,\nAlex`
          : `Hi ${o.company} team,\n\nYour post stood out · I've spent the last few years shipping Next.js + TypeScript apps with a focus on accessibility and performance, and that's exactly the kind of craft I'm looking for.\n\nHappy to share concrete examples.\n\n- Alex`;

      await db.application.upsert({
        where: { id: `app-${o.id}` },
        update: {},
        create: {
          id: `app-${o.id}`,
          jobOfferId: offer.id,
          resumeId: resume.id,
          coverLetter: draftLetter,
          language: o.language,
          status: o.status === "pending_approval" ? "pending_approval" : "draft",
          qualityScore: 0.78 + Math.random() * 0.15,
          formFields: JSON.stringify([
            { selector: "input[name='fullName']", value: "Alex Martin", type: "text" },
            { selector: "input[name='email']", value: "alex.martin@example.com", type: "email" },
            { selector: "textarea[name='coverLetter']", value: draftLetter, type: "textarea" },
          ]),
        },
      });
    }
  }
  console.log(`  ✓ ${demoOffers.length} demo job offers + matching applications seeded`);

  // ---- A few historical submitted applications for the history view ----
  console.log("→ Seeding submitted history…");
  const historyOffers = [
    { id: "hist-1", title: "Staff Engineer · Platform", company: "Forge", platformName: indeed?.name, days: 12, status: "applied", lang: "en" },
    { id: "hist-2", title: "Lead Frontend Developer", company: "Atelier Numérique", platformName: welcometothejungle?.name, days: 5, status: "applied", lang: "fr" },
    { id: "hist-3", title: "Senior React Developer (freelance)", company: "Stripe-backed startup", platformName: upwork?.name, days: 2, status: "applied", lang: "en" },
    { id: "hist-4", title: "Web-Entwickler", company: "München Digital", platformName: linkedin?.name, days: 18, status: "rejected", lang: "de" },
  ];
  for (const h of historyOffers) {
    if (!h.platformName) continue;
    const platform = await db.platform.findUnique({ where: { name: h.platformName } });
    if (!platform) continue;
    const offer = await db.jobOffer.upsert({
      where: { id: h.id },
      update: {},
      create: {
        id: h.id,
        platformId: platform.id,
        title: h.title,
        company: h.company,
        url: `https://${platform.url.replace(/^https?:\/\//, "")}/jobs/${h.id}`,
        language: h.lang,
        contractType: "full-time",
        postedAt: new Date(Date.now() - h.days * 24 * 3600 * 1000),
        detectedAt: new Date(Date.now() - h.days * 24 * 3600 * 1000),
        status: h.status,
      },
    });
    await db.application.upsert({
      where: { id: `app-${h.id}` },
      update: {},
      create: {
        id: `app-${h.id}`,
        jobOfferId: offer.id,
        resumeId: resume.id,
        coverLetter: "(submitted)",
        language: h.lang,
        status: h.status === "rejected" ? "rejected" : "submitted",
        submittedAt: new Date(Date.now() - (h.days - 1) * 24 * 3600 * 1000),
        qualityScore: 0.82,
      },
    });
  }
  console.log(`  ✓ ${historyOffers.length} history applications seeded`);

  // ---- Form field requirements per platform ----
  console.log("→ Seeding form field requirements…");
  const formFields = [
    // Indeed asks for: name, email, resume, cover letter, and sometimes custom questions
    { platformName: "Indeed", fieldKey: "full_name", fieldLabel: "Full Name", fieldType: "text", isRequired: true, detectionSelector: "input[name='name'], input[name='FullName']" },
    { platformName: "Indeed", fieldKey: "email", fieldLabel: "Email Address", fieldType: "email", isRequired: true, detectionSelector: "input[type='email']" },
    { platformName: "Indeed", fieldKey: "phone", fieldLabel: "Phone Number", fieldType: "tel", isRequired: false, detectionSelector: "input[type='tel']" },
    { platformName: "Indeed", fieldKey: "resume", fieldLabel: "Resume / CV", fieldType: "file", isRequired: true },
    { platformName: "Indeed", fieldKey: "cover_letter", fieldLabel: "Cover Letter", fieldType: "textarea", isRequired: false, detectionSelector: "textarea[name='coverletter']" },
    { platformName: "Indeed", fieldKey: "custom_why", fieldLabel: "Why are you interested in this role?", fieldType: "textarea", isRequired: true },
    { platformName: "Indeed", fieldKey: "custom_salary", fieldLabel: "What are your salary expectations?", fieldType: "text", isRequired: false },

    // Welcome to the Jungle asks for: name, email, phone, LinkedIn URL, cover letter, custom questions
    { platformName: "Welcome to the Jungle", fieldKey: "full_name", fieldLabel: "Nom complet", fieldType: "text", isRequired: true },
    { platformName: "Welcome to the Jungle", fieldKey: "email", fieldLabel: "Email", fieldType: "email", isRequired: true },
    { platformName: "Welcome to the Jungle", fieldKey: "phone", fieldLabel: "Téléphone", fieldType: "tel", isRequired: true },
    { platformName: "Welcome to the Jungle", fieldKey: "linkedin_url", fieldLabel: "URL LinkedIn", fieldType: "text", isRequired: false },
    { platformName: "Welcome to the Jungle", fieldKey: "cover_letter", fieldLabel: "Lettre de motivation", fieldType: "textarea", isRequired: true },
    { platformName: "Welcome to the Jungle", fieldKey: "custom_experience", fieldLabel: "Décrivez votre expérience pertinente", fieldType: "textarea", isRequired: true },

    // LinkedIn asks for: name, email, phone, resume, and application questions
    { platformName: "LinkedIn Jobs", fieldKey: "full_name", fieldLabel: "Full name", fieldType: "text", isRequired: true },
    { platformName: "LinkedIn Jobs", fieldKey: "email", fieldLabel: "Email", fieldType: "email", isRequired: true },
    { platformName: "LinkedIn Jobs", fieldKey: "phone", fieldLabel: "Phone", fieldType: "tel", isRequired: false },
    { platformName: "LinkedIn Jobs", fieldKey: "resume", fieldLabel: "Resume", fieldType: "file", isRequired: true },
    { platformName: "LinkedIn Jobs", fieldKey: "work_auth", fieldLabel: "Are you authorized to work in this country?", fieldType: "select", isRequired: true, options: JSON.stringify(["Yes", "No", "Need sponsorship"]) },
    { platformName: "LinkedIn Jobs", fieldKey: "custom_start", fieldLabel: "When can you start?", fieldType: "text", isRequired: true },

    // Upwork asks for: cover letter, hourly rate, availability
    { platformName: "Upwork", fieldKey: "cover_letter", fieldLabel: "Cover Letter", fieldType: "textarea", isRequired: true },
    { platformName: "Upwork", fieldKey: "hourly_rate", fieldLabel: "Hourly Rate", fieldType: "text", isRequired: true, placeholder: "$60/hr" },
    { platformName: "Upwork", fieldKey: "availability", fieldLabel: "Availability", fieldType: "select", isRequired: true, options: JSON.stringify(["Less than 10 hrs/week", "10-30 hrs/week", "30+ hrs/week"]) },
  ];

  for (const f of formFields) {
    const platform = await db.platform.findUnique({ where: { name: f.platformName } });
    if (!platform) continue;
    await db.formFieldRequirement.upsert({
      where: { id: `ff-${f.platformName}-${f.fieldKey}` },
      update: {},
      create: {
        id: `ff-${f.platformName}-${f.fieldKey}`,
        platformId: platform.id,
        fieldKey: f.fieldKey,
        fieldLabel: f.fieldLabel,
        fieldType: f.fieldType,
        isRequired: f.isRequired,
        options: f.options ?? null,
        placeholder: f.placeholder ?? null,
        detectionSelector: f.detectionSelector ?? null,
      },
    });
  }
  console.log(`  ✓ ${formFields.length} form field requirements seeded`);

  // ---- Account credentials ----
  console.log("→ Seeding account credentials…");
  const credentials = [
    { platformName: "Indeed", email: "alex.careers@gmail.com", status: "created" },
    { platformName: "LinkedIn Jobs", email: "alex.martin@example.com", status: "created" },
    { platformName: "Welcome to the Jungle", email: "alex.applications@proton.me", status: "created" },
    { platformName: "Upwork", email: "alex.careers@gmail.com", status: "created" },
  ];
  for (const c of credentials) {
    const platform = await db.platform.findUnique({ where: { name: c.platformName } });
    if (!platform) continue;
    await db.accountCredential.upsert({
      where: { id: `cred-${c.platformName}` },
      update: {},
      create: {
        id: `cred-${c.platformName}`,
        platformId: platform.id,
        email: c.email,
        status: c.status,
      },
    });
  }
  console.log(`  ✓ ${credentials.length} account credentials seeded`);

  console.log("\n✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
