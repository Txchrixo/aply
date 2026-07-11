/**
 * SEED_PLATFORMS
 * ----------------------------------------------------------------------------
 * Curated list of job platforms that the "Aply" agent should monitor.
 *
 * Categories:
 *   - generalist     : broad multi-industry job boards (EN mostly)
 *   - freelance      : short-term / gig / contract-for-hire marketplaces
 *   - remote         : remote-first job boards
 *   - tech           : developer / engineering specialised boards
 *   - startup        : early-stage / startup-focused boards
 *   - design         : creative / design-focused boards
 *   - regional_fr    : French marketplaces
 *   - regional_de    : German / DACH marketplaces
 *   - regional_other : UK, AU, CA, and other regional players
 *   - niche          : industry-specific (healthcare, education, finance, ...)
 *
 * `contractTypes` is a subset of:
 *   ["full-time","part-time","internship","freelance","remote"]
 *
 * `notes` is optional and captures anti-bot signals, login requirements,
 * Cloudflare/Akamai protections, geographic restrictions, etc.
 * ----------------------------------------------------------------------------
 */

export interface SeedPlatform {
  name: string;
  url: string;
  category:
    | "generalist"
    | "freelance"
    | "remote"
    | "tech"
    | "startup"
    | "design"
    | "regional_fr"
    | "regional_de"
    | "regional_other"
    | "niche";
  languages: string[];
  contractTypes: string[];
  hasLoginRequired: boolean;
  hasAntiBot: boolean;
  priority: "high" | "medium" | "low";
  notes?: string;
}

export const SEED_PLATFORMS: SeedPlatform[] = [
  // ===========================================================================
  // GENERALIST (broad, multi-industry, mostly English-language)
  // ===========================================================================
  {
    name: "Indeed",
    url: "https://www.indeed.com",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote", "freelance"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "Cloudflare + reCAPTCHA on apply flows. Requires Indeed account to apply via 'Apply Now'. Aggressive rate limiting on search."
  },
  {
    name: "LinkedIn Jobs",
    url: "https://www.linkedin.com/jobs",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote", "freelance"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "Hard login wall. 'Easy Apply' requires LinkedIn session + sometimes CAPTCHA. Strong bot detection (Device fingerprinting, login throttling)."
  },
  {
    name: "Glassdoor",
    url: "https://www.glassdoor.com",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "Account required to view most job detail pages; 'Easy Apply' gated behind login. PerimeterX / HUMAN protection."
  },
  {
    name: "Monster",
    url: "https://www.monster.com",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: true,
    priority: "high",
    notes: "Public search, but applying requires a Monster account. Akamai bot manager on search endpoints."
  },
  {
    name: "ZipRecruiter",
    url: "https://www.ziprecruiter.com",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "1-click apply requires account. Datadome + reCAPTCHA visible on apply."
  },
  {
    name: "CareerBuilder",
    url: "https://www.careerbuilder.com",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Search is public, but application flows redirect to employer ATS."
  },
  {
    name: "Google for Jobs",
    url: "https://www.google.com/search?q=jobs+near+me",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: true,
    priority: "high",
    notes: "Aggregator only; redirects to source ATS. Heavy bot detection on Google search; consider SerpAPI or structured-data scraping via sitemaps."
  },
  {
    name: "SimplyHired",
    url: "https://www.simplyhired.com",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Aggregator that redirects to employer ATS for application."
  },
  {
    name: "LinkUp",
    url: "https://www.linkup.com",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Indexes only employer ATS listings (no scraper boards). Clean data, lower volume."
  },
  {
    name: "Craigslist Jobs",
    url: "https://www.craigslist.org/about/sites",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: true,
    priority: "low",
    notes: "Highly fragmented by city subdomain. Email-based apply (anonymised relay). Aggressive rate-limiting & IP blocking."
  },
  {
    name: "Snagajob",
    url: "https://www.snagajob.com",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "Hourly / shift-work focus. Account required to apply."
  },
  {
    name: "Ladders",
    url: "https://www.theladders.com",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Focused on $100k+ roles. Login wall on most listings."
  },
  {
    name: "Talent.com",
    url: "https://www.talent.com",
    category: "generalist",
    languages: ["en", "fr", "de", "es"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Aggregator (formerly Jobboom / Neuvoo). Localised per country."
  },
  {
    name: "Adzuna",
    url: "https://www.adzuna.com",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "UK-origin aggregator with strong API (Adzuna API key recommended for programmatic access)."
  },
  {
    name: "Jooble",
    url: "https://www.jooble.org",
    category: "generalist",
    languages: ["en", "fr", "de"],
    contractTypes: ["full-time", "part-time", "internship", "remote", "freelance"],
    hasLoginRequired: false,
    hasAntiBot: true,
    priority: "medium",
    notes: "Global aggregator. Cloudflare challenge on some country subdomains."
  },
  {
    name: "Lensa",
    url: "https://www.lensa.com",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "ML-driven matching. Redirects to ATS for application."
  },
  {
    name: "Careerjet",
    url: "https://www.careerjet.com",
    category: "generalist",
    languages: ["en", "fr", "de", "es"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "International aggregator. Many country-specific subdomains."
  },
  {
    name: "Jobrapido",
    url: "https://www.jobrapido.com",
    category: "generalist",
    languages: ["en", "fr", "de", "it", "es"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Aggregator owned by Stepstone Group."
  },
  {
    name: "Jobcase",
    url: "https://www.jobcase.com",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Community-driven board aimed at blue-collar / hourly workers."
  },
  {
    name: "Nexxt",
    url: "https://www.nexxt.com",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Formerly Beyond.com. Email-submit required for application."
  },
  {
    name: "Job.com",
    url: "https://www.job.com",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Blockchain-flavoured US board. Most listings redirect to Indeed."
  },
  {
    name: "Joblist",
    url: "https://www.joblist.com",
    category: "generalist",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Aggregator with personalised feed. Apply flow redirects to source."
  },
  {
    name: "GrabJobs",
    url: "https://grabjobs.co",
    category: "generalist",
    languages: ["en", "fr"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Mobile-first board for front-line / hospitality jobs. Strong in SEA & EU."
  },

  // ===========================================================================
  // FREELANCE
  // ===========================================================================
  {
    name: "Upwork",
    url: "https://www.upwork.com",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance", "part-time", "full-time"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "Proposal submission requires logged-in freelancer account. Connects currency. Heavy bot/scraper protection (Cloudflare + custom fingerprinting)."
  },
  {
    name: "Fiverr",
    url: "https://www.fiverr.com",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "medium",
    notes: "Gig-based inbound only (clients find sellers). 'Fiverr Business' buyer requests gated behind login."
  },
  {
    name: "Freelancer.com",
    url: "https://www.freelancer.com",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "medium",
    notes: "Bid-based marketplace. Cloudflare on contest endpoints."
  },
  {
    name: "Toptal",
    url: "https://www.toptal.com",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance", "full-time"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "medium",
    notes: "Vetted network · requires acceptance process before projects visible. Heavily gated client side too."
  },
  {
    name: "Guru",
    url: "https://www.guru.com",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Quote-based marketplace. Older UI but stable."
  },
  {
    name: "PeoplePerHour",
    url: "https://www.peopleperhour.com",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "UK-based; strong in design/copywriting. 'Hourlies' (fixed-price services) + project proposals."
  },
  {
    name: "99designs",
    url: "https://99designs.com",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Design contest platform (now owned by Vista). 1-to-1 projects also available."
  },
  {
    name: "DesignCrowd",
    url: "https://www.designcrowd.com",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Design contest marketplace. Login required to submit entries."
  },
  {
    name: "Contra",
    url: "https://contra.com",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance", "full-time"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "Commission-free freelance network. Strong design / dev community."
  },
  {
    name: "Worksome",
    url: "https://www.worksome.com",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance", "full-time"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "EU/UK focus · handles contractor compliance. Vetted sign-up."
  },
  {
    name: "Twine",
    url: "https://www.twine.net",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Creative freelance marketplace; vetting required for premium gigs."
  },
  {
    name: "Kolabtree",
    url: "https://www.kolabtree.com",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Freelance scientists, researchers, and data analysts."
  },
  {
    name: "Truelancer",
    url: "https://www.truelancer.com",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Global freelance marketplace; many offshore / low-rate gigs."
  },
  {
    name: "Hubstaff Talent",
    url: "https://talent.hubstaff.com",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance", "full-time", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Free freelance directory; apply directly via email/contact form."
  },
  {
    name: "Gun.io",
    url: "https://www.gun.io",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance", "full-time"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Vetted senior developer network; intake interview required."
  },
  {
    name: "Lemon.io",
    url: "https://lemon.io",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance", "full-time"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Vetted offshore dev network. Screening process required."
  },
  {
    name: "Braintrust",
    url: "https://www.usebraintrust.com",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance", "full-time"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Token-based freelance network. Vetted intake."
  },
  {
    name: "Codeable",
    url: "https://codeable.co",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "WordPress-only freelance expert network. Strict vetting."
  },
  {
    name: "CloudPeeps",
    url: "https://cloudpeeps.com",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Marketing / community / content freelance network."
  },
  {
    name: "Arc.dev",
    url: "https://arc.dev",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance", "full-time", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "Remote developer network; vetting required for permanent + freelance roles."
  },
  {
    name: "Outsourcely",
    url: "https://www.outsourcely.com",
    category: "freelance",
    languages: ["en"],
    contractTypes: ["freelance", "full-time", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Long-term remote staffing marketplace."
  },

  // ===========================================================================
  // REMOTE-FIRST
  // ===========================================================================
  {
    name: "FlexJobs",
    url: "https://www.flexjobs.com",
    category: "remote",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "high",
    notes: "Paid subscription required to view full listings + apply. Hand-screened, scam-free."
  },
  {
    name: "We Work Remotely",
    url: "https://weworkremotely.com",
    category: "remote",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "high",
    notes: "Largest remote-only board. Apply via external link (no account needed on WWR itself)."
  },
  {
    name: "Remote.co",
    url: "https://remote.co",
    category: "remote",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "high",
    notes: "Sister site to FlexJobs. Free listings; apply via employer ATS."
  },
  {
    name: "Remotive",
    url: "https://remotive.com",
    category: "remote",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "high",
    notes: "Remote-only jobs with active community. Free to apply; some roles gated to Remotive community members."
  },
  {
    name: "Working Nomads",
    url: "https://www.workingnomads.com",
    category: "remote",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Curated daily remote job emails. Apply via external links."
  },
  {
    name: "Remote OK",
    url: "https://remoteok.com",
    category: "remote",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "high",
    notes: "Public JSON API at /api. Apply via external apply URL on each listing."
  },
  {
    name: "Jobspresso",
    url: "https://jobspresso.co",
    category: "remote",
    languages: ["en"],
    contractTypes: ["full-time", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Hand-curated remote jobs in tech, marketing, and customer support."
  },
  {
    name: "JustRemote",
    url: "https://justremote.co",
    category: "remote",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Some roles gated behind 'Power Search' paid tier."
  },
  {
    name: "Remoters",
    url: "https://remoters.net",
    category: "remote",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Community-run remote jobs board."
  },
  {
    name: "Virtual Vocations",
    url: "https://www.virtualvocations.com",
    category: "remote",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Paid subscription required to view full listings + apply."
  },
  {
    name: "Pangian",
    url: "https://pangian.com",
    category: "remote",
    languages: ["en"],
    contractTypes: ["full-time", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Remote-focused; visual-heavy listings. Apply via external links."
  },
  {
    name: "Skip the Drive",
    url: "https://www.skipthedrive.com",
    category: "remote",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Remote-only board. Apply via external ATS links."
  },
  {
    name: "DailyRemote",
    url: "https://dailyremote.com",
    category: "remote",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Remote jobs newsletter + board. Some listings gated behind paid filter."
  },
  {
    name: "Remote People",
    url: "https://remotepeople.com",
    category: "remote",
    languages: ["en"],
    contractTypes: ["full-time", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Remote jobs aggregator."
  },
  {
    name: "Remote4Me",
    url: "https://remote4me.com",
    category: "remote",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Aggregator of remote dev / IT roles from many sources."
  },
  {
    name: "Europe Remote",
    url: "https://europeremote.com",
    category: "remote",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "EU timezone-focused remote board."
  },

  // ===========================================================================
  // FRENCH REGIONAL
  // ===========================================================================
  {
    name: "France Travail (Pôle Emploi)",
    url: "https://www.francetravail.fr",
    category: "regional_fr",
    languages: ["fr"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "Official French public employment service. Apply requires 'espace personnel' candidate account. Anti-bot on /recherche endpoints; use France Travail API (Pôle Emploi API) with registered credentials."
  },
  {
    name: "HelloWork",
    url: "https://www.hellowork.com",
    category: "regional_fr",
    languages: ["fr"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: true,
    priority: "high",
    notes: "Largest French private board (formerly RegionsJob). 'Postuler' triggers HelloCV form. Cloudflare protection."
  },
  {
    name: "Welcome to the Jungle",
    url: "https://www.welcometothejungle.com",
    category: "regional_fr",
    languages: ["fr", "en"],
    contractTypes: ["full-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "Premium employer-branding board. Application requires WTJ account + pre-fill form. Strong bot protection."
  },
  {
    name: "Leboncoin Emploi",
    url: "https://www.leboncoin.fr/emploi",
    category: "regional_fr",
    languages: ["fr"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: true,
    priority: "medium",
    notes: "Classified ads marketplace with job section. Heavy Cloudflare + Datadome. Email-based apply."
  },
  {
    name: "Apec",
    url: "https://www.apec.fr",
    category: "regional_fr",
    languages: ["fr"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "Cadre / executive jobs. Login required for application; Apec cadres account (free)."
  },
  {
    name: "Keljob",
    url: "https://www.keljob.com",
    category: "regional_fr",
    languages: ["fr"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Owned by Figaro Group. Aggregator + direct listings. Apply via employer sites."
  },
  {
    name: "Meteojob",
    url: "https://www.meteojob.com",
    category: "regional_fr",
    languages: ["fr"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Matching-based French board (Talent.com group). 'Candidature 1 clic' available with account."
  },
  {
    name: "Cadremploi",
    url: "https://www.cadremploi.fr",
    category: "regional_fr",
    languages: ["fr"],
    contractTypes: ["full-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "Executive / cadre roles. Account required for 'Postuler rapidement'."
  },
  {
    name: "Jobijoba",
    url: "https://www.jobijoba.com",
    category: "regional_fr",
    languages: ["fr", "en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "International aggregator with strong FR presence. Localised country sites."
  },
  {
    name: "Trovit France",
    url: "https://fr.trovit.com",
    category: "regional_fr",
    languages: ["fr"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Classified aggregator. Apply always redirects to source."
  },
  {
    name: "La Bonne Alternance",
    url: "https://labonnealternance.apprentissage.beta.gouv.fr",
    category: "regional_fr",
    languages: ["fr"],
    contractTypes: ["internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Government-built board for apprenticeship / work-study (alternance) in France."
  },
  {
    name: "Jobteaser",
    url: "https://www.jobteaser.com",
    category: "regional_fr",
    languages: ["fr", "en", "de"],
    contractTypes: ["full-time", "internship", "part-time"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "Campus recruiting SaaS; access via university student account required."
  },
  {
    name: "Wizbii",
    url: "https://www.wizbii.com",
    category: "regional_fr",
    languages: ["fr"],
    contractTypes: ["full-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Young-graduates focused (FR). Account required for apply."
  },
  {
    name: "Distrijob",
    url: "https://www.distrijob.fr",
    category: "regional_fr",
    languages: ["fr"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "FR job board for distribution, retail, transport and logistics."
  },
  {
    name: "Viadeo",
    url: "https://www.viadeo.com",
    category: "regional_fr",
    languages: ["fr"],
    contractTypes: ["full-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "French LinkedIn alternative (now smaller). Login wall on job listings."
  },
  {
    name: "WeLoveDevs",
    url: "https://welovedevs.com",
    category: "regional_fr",
    languages: ["fr", "en"],
    contractTypes: ["full-time", "internship", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "French developer-focused board with salary transparency."
  },
  {
    name: "FrenchTech Jobs",
    url: "https://jobs.lafrenchtech.com",
    category: "regional_fr",
    languages: ["fr", "en"],
    contractTypes: ["full-time", "internship", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Official French Tech job board for startups. Apply via employer links."
  },
  {
    name: "Indeed France",
    url: "https://www.indeed.fr",
    category: "regional_fr",
    languages: ["fr"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "French localisation of Indeed. Same apply rules as Indeed.com (account + Cloudflare)."
  },

  // ===========================================================================
  // GERMAN / DACH REGIONAL
  // ===========================================================================
  {
    name: "StepStone Germany",
    url: "https://www.stepstone.de",
    category: "regional_de",
    languages: ["de"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "Largest German board. Apply requires 'Mein StepStone' account. Akamai + custom bot detection."
  },
  {
    name: "XING Jobs",
    url: "https://www.xing.com/jobs",
    category: "regional_de",
    languages: ["de", "en"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "DACH LinkedIn alternative. Hard login wall for listings beyond 5 results. Cloudflare + login gate."
  },
  {
    name: "Absolventa",
    url: "https://www.absolventa.de",
    category: "regional_de",
    languages: ["de"],
    contractTypes: ["full-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Graduate & internship focus. Apply via employer ATS or Absolventa CV (login)."
  },
  {
    name: "Jobware",
    url: "https://www.jobware.de",
    category: "regional_de",
    languages: ["de"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Long-running German board. Apply via employer ATS links."
  },
  {
    name: "Staufenbiel",
    url: "https://www.staufenbiel.de",
    category: "regional_de",
    languages: ["de"],
    contractTypes: ["full-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Graduate careers & internships. Now part of Absolventa group."
  },
  {
    name: "Kimeta",
    url: "https://www.kimeta.de",
    category: "regional_de",
    languages: ["de"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "German aggregator. Apply via employer ATS links."
  },
  {
    name: "Meinestadt",
    url: "https://www.meinestadt.de",
    category: "regional_de",
    languages: ["de"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Local jobs by city; strong regional listings."
  },
  {
    name: "Bundesagentur für Arbeit (Jobbörse)",
    url: "https://www.arbeitsagentur.de/jobsuche/suche",
    category: "regional_de",
    languages: ["de"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: true,
    priority: "high",
    notes: "Official German federal employment agency. Application via employer contact or via Vermittlungsservice (login)."
  },
  {
    name: "Yourfirm",
    url: "https://www.yourfirm.de",
    category: "regional_de",
    languages: ["de"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Mittelstand / SME focus in Germany."
  },
  {
    name: "Praktikum.info",
    url: "https://www.praktikum.info",
    category: "regional_de",
    languages: ["de"],
    contractTypes: ["internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Internship-focused DACH board."
  },
  {
    name: "Azubiyo",
    url: "https://www.azubiyo.de",
    category: "regional_de",
    languages: ["de"],
    contractTypes: ["internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Apprenticeship (Ausbildung) board in Germany."
  },
  {
    name: "Berlin Startup Jobs",
    url: "https://berlinstartupjobs.com",
    category: "regional_de",
    languages: ["en", "de"],
    contractTypes: ["full-time", "internship", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Berlin startup ecosystem board; English-language listings. Apply via employer links."
  },
  {
    name: "Jobbörse.de",
    url: "https://www.jobboerse.de",
    category: "regional_de",
    languages: ["de"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "German aggregator; redirects to source ATS."
  },
  {
    name: "Indeed Germany",
    url: "https://www.indeed.de",
    category: "regional_de",
    languages: ["de"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "German localisation of Indeed. Same login + Cloudflare as parent."
  },
  {
    name: "Munich Startup Jobs",
    url: "https://www.munich-startup.de/jobs",
    category: "regional_de",
    languages: ["de", "en"],
    contractTypes: ["full-time", "internship", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Munich startup ecosystem board."
  },

  // ===========================================================================
  // REGIONAL OTHER (UK, AU, CA, IN, ...)
  // ===========================================================================
  {
    name: "Totaljobs",
    url: "https://www.totaljobs.com",
    category: "regional_other",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "Largest UK board. Account required to apply; Stepstone Group · shares Akamai protections."
  },
  {
    name: "Reed",
    url: "https://www.reed.co.uk",
    category: "regional_other",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "high",
    notes: "UK board; account required for 'Quick Apply'. Strong salary data."
  },
  {
    name: "CWJobs",
    url: "https://www.cwjobs.co.uk",
    category: "regional_other",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "UK IT/Tech specialist. Same family as Totaljobs; shared account."
  },
  {
    name: "CV-Library",
    url: "https://www.cv-library.co.uk",
    category: "regional_other",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "UK generalist; CV required to apply (account-based)."
  },
  {
    name: "Jobsite UK",
    url: "https://www.jobsite.co.uk",
    category: "regional_other",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "Stepstone Group UK board; shared login with Totaljobs."
  },
  {
    name: "Guardian Jobs",
    url: "https://jobs.theguardian.com",
    category: "regional_other",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "UK public sector / media / NGO roles. Account required to apply."
  },
  {
    name: "Fish4Jobs",
    url: "https://www.fish4.co.uk",
    category: "regional_other",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "UK regional board. Apply via employer ATS."
  },
  {
    name: "Seek Australia",
    url: "https://www.seek.com.au",
    category: "regional_other",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "Dominant AU/NZ board. Apply requires SEEK account + Cloudflare protection."
  },
  {
    name: "Jora",
    url: "https://www.jora.com",
    category: "regional_other",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "SEEK-owned aggregator with AU/Asia focus."
  },
  {
    name: "CareerOne",
    url: "https://www.careerone.com.au",
    category: "regional_other",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Australian board partnered with News Corp."
  },
  {
    name: "GradConnection",
    url: "https://au.gradconnection.com",
    category: "regional_other",
    languages: ["en"],
    contractTypes: ["internship", "full-time"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Graduate program aggregator for AU/NZ/UK/Asia."
  },
  {
    name: "APS Jobs",
    url: "https://www.apsjobs.gov.au",
    category: "regional_other",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Australian Public Service vacancies. Apply via agency sites."
  },
  {
    name: "Job Bank Canada",
    url: "https://www.jobbank.gc.ca",
    category: "regional_other",
    languages: ["en", "fr"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "high",
    notes: "Government of Canada board. Account ('Job Bank account') optional for 'Standard+ apply'."
  },
  {
    name: "Eluta",
    url: "https://www.eluta.ca",
    category: "regional_other",
    languages: ["en", "fr"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Canadian aggregator that indexes employer ATS pages."
  },
  {
    name: "Jobboom (Quebec)",
    url: "https://www.jobboom.com",
    category: "regional_other",
    languages: ["fr", "en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Quebecois board (Talent.com family). Apply via external links."
  },
  {
    name: "WowJobs",
    url: "https://www.wowjobs.ca",
    category: "regional_other",
    languages: ["en", "fr"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Canadian aggregator."
  },
  {
    name: "Indeed Canada",
    url: "https://ca.indeed.com",
    category: "regional_other",
    languages: ["en", "fr"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "Canadian localisation of Indeed; shared login + Cloudflare."
  },
  {
    name: "Glassdoor Canada",
    url: "https://www.glassdoor.ca",
    category: "regional_other",
    languages: ["en", "fr"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "medium",
    notes: "Canadian localisation of Glassdoor; same login wall."
  },
  {
    name: "Naukri (India)",
    url: "https://www.naukri.com",
    category: "regional_other",
    languages: ["en", "hi"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "India's largest board. Apply requires Naukri account. Aggressive anti-bot."
  },
  {
    name: "Indeed India",
    url: "https://www.indeed.co.in",
    category: "regional_other",
    languages: ["en", "hi"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "medium",
    notes: "Indian localisation of Indeed."
  },
  {
    name: "InfoJobs Spain",
    url: "https://www.infojobs.net",
    category: "regional_other",
    languages: ["es"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "Spain's leading board (Schibsted-owned). Login required to apply."
  },
  {
    name: "InfoJobs Italy",
    url: "https://www.infojobs.it",
    category: "regional_other",
    languages: ["it"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "Italian branch of InfoJobs."
  },
  {
    name: "LinkedIn Jobs (Localized Aggregator)",
    url: "https://www.linkedin.com/jobs/search",
    category: "regional_other",
    languages: ["en", "fr", "de", "es", "it", "pt"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "Already covered by LinkedIn entry · this is the multi-language search entrypoint. Login wall applies globally."
  },

  // ===========================================================================
  // TECH / DEVELOPER FOCUSED
  // ===========================================================================
  {
    name: "Dice",
    url: "https://www.dice.com",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "US tech/IT specialist. Account required to apply; Cloudflare/Datadome present."
  },
  {
    name: "Hired",
    url: "https://hired.com",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "Reverse-auction marketplace; candidates receive offers from companies. Profile approval required."
  },
  {
    name: "Hacker News Who's Hiring",
    url: "https://news.ycombinator.com/jobs",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: true,
    priority: "high",
    notes: "Monthly 'Ask HN: Who is hiring?' thread is the goldmine. Apply via email / external link. HN has rate-limiting + Cloudflare."
  },
  {
    name: "TripleByte (now Karat)",
    url: "https://triplebyte.com",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Now pivoted to interviewer network; classic 'one application → many companies' marketplace has wound down."
  },
  {
    name: "Relocate.me",
    url: "https://relocate.me",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Developer jobs with relocation packages."
  },
  {
    name: "Cryptocurrency Jobs",
    url: "https://cryptocurrencyjobs.co",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Web3 / blockchain specialist board."
  },
  {
    name: "Web3.career",
    url: "https://web3.career",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Crypto/web3 developer jobs. Apply via external links."
  },
  {
    name: "VueJobs",
    url: "https://vuejobs.com",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Vue.js developer jobs."
  },
  {
    name: "Larajobs",
    url: "https://larajobs.com",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Laravel / PHP ecosystem job board."
  },
  {
    name: "WordPress Jobs",
    url: "https://jobs.wordpress.net",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Official WordPress foundation job board."
  },
  {
    name: "Golang Projects",
    url: "https://www.golangprojects.com",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Go developer jobs aggregator."
  },
  {
    name: "Rust Jobs",
    url: "https://rustjobs.dev",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Rust developer jobs."
  },
  {
    name: "RubyNow",
    url: "https://www.rubynow.com",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Ruby/Rails job board."
  },
  {
    name: "iOS Dev Jobs",
    url: "https://iosdevjobs.com",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "iOS / Swift developer jobs."
  },
  {
    name: "4 Day Week",
    url: "https://4dayweek.io",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Tech-leaning remote jobs offering 4-day work weeks."
  },
  {
    name: "Stack Overflow Jobs (Discontinued)",
    url: "https://stackoverflow.com/jobs",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Discontinued in 2022; left here for historical reference. Do not include in active scraping."
  },
  {
    name: "GitHub Jobs (Discontinued)",
    url: "https://www.github.com/about/careers",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Original GitHub Jobs board discontinued in 2021. GitHub's own careers page still active."
  },
  {
    name: "Authentic Jobs",
    url: "https://authenticjobs.com",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Design / dev board, US-centric. Apply via external links."
  },
  {
    name: "PowerToFly",
    url: "https://powertofly.com/jobs",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "Women-in-tech focused remote jobs. Account required for apply."
  },
  {
    name: "Cryptocurrency Jobs (Aggregator)",
    url: "https://crypto.jobs",
    category: "tech",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Crypto/web3 job aggregator."
  },

  // ===========================================================================
  // STARTUP FOCUSED
  // ===========================================================================
  {
    name: "Wellfound (formerly AngelList Talent)",
    url: "https://wellfound.com",
    category: "startup",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: true,
    priority: "high",
    notes: "Startup-focused apply platform. Login required (Wellfound account); recruiter messaging + 1-click apply."
  },
  {
    name: "Otta",
    url: "https://otta.com",
    category: "startup",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "high",
    notes: "Curated startup + tech jobs. Apply via Otta (requires account)."
  },
  {
    name: "Y Combinator Work at a Startup",
    url: "https://www.workatastartup.com",
    category: "startup",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "high",
    notes: "YC-backed startups only. Requires candidate profile to apply; founder-direct messaging."
  },
  {
    name: "BuiltIn",
    url: "https://builtin.com",
    category: "startup",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "high",
    notes: "BuiltIn NYC/SF/Austin/etc. · strong US startup / scale-up coverage. Apply via employer ATS."
  },
  {
    name: "Startup.jobs",
    url: "https://startup.jobs",
    category: "startup",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Global startup jobs board; apply via external links."
  },
  {
    name: "EU Startups Jobs",
    url: "https://www.eu-startups.com/jobs",
    category: "startup",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "European startup ecosystem board."
  },
  {
    name: "Crunchboard",
    url: "https://www.crunchboard.com",
    category: "startup",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "TechCrunch-affiliated board. Apply via external links."
  },
  {
    name: "Otta (Career Hub)",
    url: "https://otta.com/careers",
    category: "startup",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Otta editorial 'best companies' lists. Browse-only; apply via Otta main app."
  },
  {
    name: "Y Combinator Top Companies",
    url: "https://www.ycombinator.com/topcompanies",
    category: "startup",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Curated hiring YC alumni list; redirects to company careers pages."
  },

  // ===========================================================================
  // DESIGN / CREATIVE
  // ===========================================================================
  {
    name: "Dribbble Jobs",
    url: "https://dribbble.com/jobs",
    category: "design",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Designer-focused board. Apply via external links (employer ATS)."
  },
  {
    name: "Behance Jobs",
    url: "https://www.behance.net/joblist",
    category: "design",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Adobe-owned creative portfolio site job board."
  },
  {
    name: "AIGA Design Jobs",
    url: "https://www.aiga.org/jobs",
    category: "design",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Professional association for design job board."
  },
  {
    name: "Coroflot",
    url: "https://www.coroflot.com",
    category: "design",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Long-running designer portfolio + jobs board."
  },
  {
    name: "Working Not Working",
    url: "https://workingnotworking.com",
    category: "design",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Invite-only creative network. Account required to apply."
  },
  {
    name: "The Dots",
    url: "https://the-dots.com",
    category: "design",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "UK-focused creative professional network. Account required."
  },
  {
    name: "Krop",
    url: "https://www.krop.com",
    category: "design",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Designer portfolio + jobs site."
  },
  {
    name: "DesignJobsBoard",
    url: "https://designjobsboard.com",
    category: "design",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Independent UK/EU designer job board."
  },
  {
    name: "If You Could Jobs",
    url: "https://ifyoucouldjobs.com",
    category: "design",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "UK creative jobs board by 'It's Nice That'."
  },
  {
    name: "AIGA Eye on Design Jobs",
    url: "https://eyeondesign.aiga.org",
    category: "design",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "AIGA editorial site with job listings cross-posted."
  },

  // ===========================================================================
  // NICHE / SPECIALIZED
  // ===========================================================================
  {
    name: "USAJobs",
    url: "https://www.usajobs.gov",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "US federal government jobs. Apply via USAJOBS account (free, login.gov)."
  },
  {
    name: "Government Jobs",
    url: "https://www.governmentjobs.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "US state & local government jobs (NeoGov). Account required."
  },
  {
    name: "Care.com",
    url: "https://www.care.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "freelance"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "Childcare / senior care / pet care. Account required; background check optional."
  },
  {
    name: "Health eCareers",
    url: "https://www.healthcareers.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "Healthcare specialist board. Apply via employer ATS."
  },
  {
    name: "Nurse.com",
    url: "https://www.nurse.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "Nursing jobs + CE. Account required to apply."
  },
  {
    name: "Teach Away",
    url: "https://www.teachaway.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "International K-12 + ESL teaching jobs. Account required."
  },
  {
    name: "HigherEdJobs",
    url: "https://www.higheredjobs.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "medium",
    notes: "US higher-education positions. Apply via employer ATS."
  },
  {
    name: "EdJoin",
    url: "https://www.edjoin.org",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "US K-12 public school jobs. Account required for application."
  },
  {
    name: "SchoolSpring",
    url: "https://www.schoolspring.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "K-12 educator jobs (US). Account required."
  },
  {
    name: "eFinancialCareers",
    url: "https://www.efinancialcareers.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "Finance / banking / accounting specialist. Account required to apply."
  },
  {
    name: "Lawjobs.com",
    url: "https://www.lawjobs.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Legal professions board. Apply via employer links."
  },
  {
    name: "Idealist",
    url: "https://www.idealist.org",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "Nonprofit / social-impact jobs. Account required for 'Apply now'."
  },
  {
    name: "Devex",
    url: "https://www.devex.com/jobs",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Global development / NGO / humanitarian careers. Account required."
  },
  {
    name: "EntertainmentCareers.net",
    url: "https://www.entertainmentcareers.net",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Film/TV/music industry jobs + internships."
  },
  {
    name: "Backstage",
    url: "https://www.backstage.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "freelance", "internship"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Acting / performing-arts casting calls. Subscription required for full apply."
  },
  {
    name: "MediaBistro",
    url: "https://www.mediabistro.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Media / journalism / content jobs. Apply via employer links."
  },
  {
    name: "Hosco",
    url: "https://www.hosco.com",
    category: "niche",
    languages: ["en", "fr", "es"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "medium",
    notes: "Global hospitality & tourism careers. Account required to apply."
  },
  {
    name: "Hcareers",
    url: "https://www.hcareers.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "North America hospitality jobs."
  },
  {
    name: "Cool Works",
    url: "https://www.coolworks.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship", "freelance"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Seasonal / resort / national parks jobs."
  },
  {
    name: "AgCareers",
    url: "https://www.agcareers.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Agriculture / agribusiness jobs."
  },
  {
    name: "Rigzone",
    url: "https://www.rigzone.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Oil & gas / energy industry jobs. Account required for apply."
  },
  {
    name: "Energy Jobline",
    url: "https://www.energyjobline.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Energy (oil/gas/renewables) job board."
  },
  {
    name: "ConstructionJobs.com",
    url: "https://www.constructionjobs.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Construction & skilled trades jobs."
  },
  {
    name: "CDLjobs.com",
    url: "https://www.cdljobs.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Truck driving / commercial driver jobs (US)."
  },
  {
    name: "Aviation Job Search",
    url: "https://www.aviationjobsearch.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "remote"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Aviation industry jobs (pilots, cabin crew, engineers)."
  },
  {
    name: "Teamwork Online",
    url: "https://www.teamworkonline.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "Sports / live-events industry jobs. Account required."
  },
  {
    name: "Conservation Job Board",
    url: "https://www.conservationjobboard.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Environmental / conservation careers."
  },
  {
    name: "Clean Energy Jobs",
    url: "https://cleanenergyjobs.org",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Renewables / clean energy jobs board."
  },
  {
    name: "Caterer.com",
    url: "https://www.caterer.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "part-time", "internship"],
    hasLoginRequired: true,
    hasAntiBot: false,
    priority: "low",
    notes: "UK hospitality & catering jobs. Stepstone Group; shared login with Totaljobs."
  },
  {
    name: "ESL Cafe (Dave's)",
    url: "https://www.eslcafe.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "freelance"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Worldwide ESL teaching jobs board. Apply via email."
  },
  {
    name: "VolunteerMatch",
    url: "https://www.volunteermatch.org",
    category: "niche",
    languages: ["en"],
    contractTypes: ["part-time", "internship", "freelance"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Volunteer opportunities (US). Useful for early-career candidates building experience."
  },
  {
    name: "EdSurge Jobs",
    url: "https://www.edsurge.com/jobs",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "internship", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "EdTech industry jobs board."
  },
  {
    name: "BilingualJobBoard",
    url: "https://bilingualjobboard.com",
    category: "niche",
    languages: ["en", "fr", "es"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Multilingual / bilingual jobs board."
  },
  {
    name: "Bilingual Care",
    url: "https://www.bilingualcareers.com",
    category: "niche",
    languages: ["en", "fr"],
    contractTypes: ["full-time", "part-time", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Canada-focused bilingual EN/FR careers."
  },
  {
    name: "Mashable Jobs",
    url: "https://jobs.mashable.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Digital media / tech roles via Mashable's board."
  },
  {
    name: "SalesGravy Jobs",
    url: "https://www.salesgravy.com/jobs",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Sales / account-executive roles."
  },
  {
    name: "MarketingHire",
    url: "https://www.marketinghire.com",
    category: "niche",
    languages: ["en"],
    contractTypes: ["full-time", "freelance", "internship", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Marketing / advertising jobs board."
  },
  {
    name: "FreshGigs.ca",
    url: "https://freshgigs.ca",
    category: "niche",
    languages: ["en", "fr"],
    contractTypes: ["full-time", "internship", "freelance", "remote"],
    hasLoginRequired: false,
    hasAntiBot: false,
    priority: "low",
    notes: "Canadian marketing / creative / comms jobs."
  }
];

/**
 * Quick sanity helpers (not exported at runtime · used by internal tooling).
 * These are kept as constants to enable future category-based filtering.
 */
export const PLATFORM_CATEGORIES: ReadonlyArray<SeedPlatform["category"]> = [
  "generalist",
  "freelance",
  "remote",
  "tech",
  "startup",
  "design",
  "regional_fr",
  "regional_de",
  "regional_other",
  "niche",
] as const;

export const CONTRACT_TYPES: ReadonlyArray<
  "full-time" | "part-time" | "internship" | "freelance" | "remote"
> = ["full-time", "part-time", "internship", "freelance", "remote"] as const;
