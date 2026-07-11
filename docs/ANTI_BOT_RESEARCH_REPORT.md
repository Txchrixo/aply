# Anti-Bot Bypass Research for an Auto-Application Agent

> Research compiled for a Next.js + Bun project. Focus: FREE and open-source
> solutions that are practically implementable. All star counts are approximate
> (sourced from public GitHub search snippets; the unauthenticated GitHub API
> was rate-limited at time of research).

---

## TL;DR - Recommended Stack for Next.js + Bun

| Layer | Primary Pick | Backup / Alt | Cost |
|-------|-------------|--------------|------|
| Browser automation | **rebrowser-playwright** or **patchright-nodejs** | puppeteer-extra + stealth | Free |
| Human behavior | **ghost-cursor** + **human-typing plugin** | manual delays | Free |
| Fingerprint | **CloakBrowser** or **Camoufox** (Docker) | stealth plugin evasions | Free |
| Cloudflare (light) | **cloudscraper** via a Python sidecar | **FlareSolverr** (Docker) | Free |
| CAPTCHA (last resort) | **CapSolver** ($0.50 trial credit) | **2Captcha** pay-as-you-go | Paid only |
| Job discovery | **Greenhouse / Lever / Ashby public APIs** | Indeed RSS, RSS.app | Free |
| Proxies | Bright Data free tier (5K records) | free-proxy-lists (unreliable) | Free tier |

**Key strategic insight**: Do not fight Cloudflare/CAPTCHA on every request.
Instead, prefer ATS public APIs and RSS feeds (no anti-bot) for job discovery,
and reserve stealth browser automation for the actual application submission step.

---

## 1. Puppeteer Stealth (puppeteer-extra-plugin-stealth)

| Field | Value |
|-------|-------|
| Name | puppeteer-extra + puppeteer-extra-plugin-stealth |
| URL | https://github.com/berstend/puppeteer-extra |
| NPM | https://www.npmjs.com/package/puppeteer-extra-plugin-stealth |
| Free? | Yes - MIT |
| Node.js/Bun? | Yes (native Node, designed for it) |
| Stars | ~6.5k+ (puppeteer-extra monorepo) |

**How it works**: A modular plugin framework for Puppeteer. The stealth plugin
applies ~10 "evasion" modules (navigator.webdriver, chrome.runtime,
sourceUrl leak, WebGL vendor, languages, plugins, etc.) injected via
`evaluateOnNewDocument` so they run before page scripts.

**Strengths**:
- Drop-in replacement for `puppeteer` - minimal code changes.
- Same ecosystem supports `playwright-extra` (the plugin works on both).
- Mature, well documented, huge community knowledge base.
- Can toggle individual evasions to keep things modular.

**Limitations**:
- GitHub issues #182, #920 confirm it is regularly **detected by DataDome
  and modern Cloudflare** (especially Grok.com-style Turnstile pages).
- It only patches JavaScript-visible leaks. It does NOT patch the deeper
  **CDP (Chrome DevTools Protocol) leaks** that advanced detectors check
  (Runtime.enable, Target.setAutoAttach, sourceUrl in stack traces).
- Reddit consensus (r/webscraping): for 2024-2026 sites, prefer
  rebrowser-playwright or patchright instead.
- Headless Chrome itself leaks many signals stealth cannot fix.

**Verdict**: Good baseline for low/medium-defense sites (many ATS portals).
Insufficient for Cloudflare-protected or DataDome-protected job boards.

---

## 2. Playwright Stealth Alternatives

### 2a. playwright-extra + stealth (same author as puppeteer-extra)
| Field | Value |
|-------|-------|
| URL | https://github.com/berstend/puppeteer-extra (playwright-extra package) |
| Free? | Yes - MIT |
| Node.js/Bun? | Yes |
| Stars | part of the puppeteer-extra monorepo |

Same stealth plugin, ported to Playwright. Same evasion set, same limitations.

### 2b. rebrowser-patches / rebrowser-playwright / rebrowser-puppeteer  **[RECOMMENDED]**
| Field | Value |
|-------|-------|
| URL | https://github.com/rebrowser/rebrowser-patches |
| NPM | rebrowser-puppeteer-core, rebrowser-playwright |
| Free? | Yes - MIT |
| Node.js/Bun? | Yes (native npm packages) |
| Stars | ~2k+ |

**How it works**: Patches the Puppeteer/Playwright source code itself to fix
**CDP-level leaks** that stealth plugins cannot reach: the
`Runtime.enable`/`Page.createIsolatedWorld` detection, `console.log` sourceURL
leaks, `navigator.webdriver`, and code stack traces. Distributed as a
drop-in replacement (`rebrowser-puppeteer-core` / `rebrowser-playwright`).

**Strengths**:
- Addresses the root cause (CDP) that stealth plugins only paper over.
- Explicitly marketed as bypassing Cloudflare + DataDome CAPTCHA pages.
- Drop-in replacement: change your import, keep the rest of your code.
- Active maintenance (releases in 2024-2026).

**Limitations**:
- Some tests still red on `sourceUrlLeak` (issue #1) - not perfect.
- Requires using their patched browser binaries, not stock Playwright browsers.
- Smaller community than puppeteer-extra.

### 2c. patchright (Kaliiiiiiiiii-Vinyzu)
| Field | Value |
|-------|-------|
| URL | https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-nodejs |
| URL (Python) | https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-python |
| Free? | Yes - Apache 2.0 |
| Node.js/Bun? | Yes (patchright-nodejs) |
| Stars | ~3k-5k |

**How it works**: A patched fork of Playwright. Fixes the same CDP-leak
signals (`Runtime.enable`, isolated worlds) plus additional anti-detection
patches. Distributed as a drop-in Playwright replacement with Node.js,
Python, and .NET variants.

**Strengths**:
- Competes with rebrowser; both patch at the source level.
- Drop-in replacement for `playwright`.
- An independent benchmark (ianlpaterson.com) tested 7 stealth tools against
  31 Cloudflare targets and ranked patchright highly.

**Limitations**:
- Still cannot bypass every advanced detector (Turnstile under "Under Attack"
  mode often still blocks it).
- Need to keep up with upstream Playwright releases.

**Verdict for Playwright users**: Use **rebrowser-playwright OR patchright-nodejs**.
Pick one; both are the modern state-of-the-art for Node stealth.

---

## 3. undetected-chromedriver and Successor (nodriver)

### 3a. undetected-chromedriver
| Field | Value |
|-------|-------|
| URL | https://github.com/ultrafunkamsterdam/undetected-chromedriver |
| Free? | Yes - GPL |
| Node.js/Bun? | **No - Python only** (Java fork exists: bramar2/undetectedselenium) |
| Stars | ~10k+ |

**How it works**: Patches the Selenium chromedriver binary itself to remove
the `cdc_` variables and other tells that trigger anti-bot services
(Distill, Imperva, DataDome, Botprotect.io). Auto-downloads + patches the
driver binary on install.

**Limitations**:
- **Officially no longer actively maintained** (discussion #2309). Maintained
  forks now exist.
- Selenium-based, so it still has webdriver protocol overhead.
- Python ecosystem only - cannot run natively in Bun/Node. Would require a
  Python sidecar microservice.

### 3b. nodriver (official successor)
| Field | Value |
|-------|-------|
| URL | https://github.com/ultrafunkamsterdam/nodriver |
| Free? | Yes |
| Node.js/Bun? | **No - Python only** |
| Stars | ~2k+ (per bytetunnels.com) |

**How it works**: Drops Selenium/webdriver entirely. Talks to Chrome directly
via the DevTools Protocol (CDP) without the webdriver layer, eliminating a
huge class of detection signals. Async-first Python framework.

**Limitations**:
- Python only - in a Next.js + Bun stack you'd need to run it as a separate
  Python service (e.g. via a Docker sidecar or `bun spawn` calling `python`).
- Newer API, less community tooling than Playwright.

**Verdict**: Not directly usable in a pure Bun stack. Consider only if you
are willing to add a Python sidecar for the hardest-to-bypass sites.

---

## 4. Cloudflare Bypass

### 4a. FlareSolverr
| Field | Value |
|-------|-------|
| URL | https://github.com/Flaresolverr/FlareSolverr |
| Free? | Yes - MIT |
| Node.js/Bun? | **No (Python) but exposes an HTTP API** - callable from Bun via fetch |
| Stars | **~14.7k** (confirmed in search snippet) |

**How it works**: Runs a local proxy server. You POST your target URL to it;
FlareSolverr spins up a headless browser (undetected-chromedriver), solves the
Cloudflare "I'm Under Attack Mode" (IUAM) JS challenge, and returns the
clearance cookies + HTML. Reuse those cookies in your own (Bun) HTTP requests.

**Strengths**:
- Language-agnostic HTTP API - works perfectly from Bun via `fetch`.
- Self-hostable in Docker.
- Huge community (14.7k stars), used widely in *arr stacks (Prowlarr etc.).

**Limitations**:
- Discussed in #702: struggles with "Under Attack Mode" on the strictest
  Cloudflare configs (needs a residential proxy alongside it).
- Adds latency (full browser boot per challenge).
- Some sites now require Turnstile, which FlareSolverr cannot solve alone.

**Integration pattern in Bun**:
```ts
const res = await fetch('http://localhost:8191/v1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cmd: 'request.get',
    url: 'https://protected-job-board.com/jobs',
    maxTimeout: 60000,
  }),
});
const { solution } = await res.json();
// solution.cookies + solution.userAgent + solution.response
```

### 4b. cloudscraper
| Field | Value |
|-------|-------|
| URL | https://github.com/VeNoMouS/cloudscraper |
| Free? | Yes - LGPL |
| Node.js/Bun? | **No - Python only** (Node port: `cloudscraper` npm is unmaintained) |
| Stars | **~6.6k** (confirmed in search snippet) |

**How it works**: Pure-Python module that solves the legacy Cloudflare IUAM
JS challenge without a browser - it reimplements the challenge JS in Python.
Newer versions also support Cloudflare Turnstile token retrieval.

**Limitations**:
- Only handles the *old* JS challenge. Useless against Turnstile, managed
  challenges, and "Under Attack Mode" with modern checks.
- Python only.

### 4c. CloakBrowser
| Field | Value |
|-------|-------|
| URL | https://github.com/CloakHQ/cloakbrowser |
| Free? | Has a FREE tier (free for most use) |
| Node.js/Bun? | Stealth Chromium binary - drivable from Playwright/Puppeteer in Node |
| Stars | Newer project |

**How it works**: A stealth Chromium build with built-in deterministic
fingerprint seeding and noise injection (canvas, WebGL, audio, client rects)
exposed as CLI flags (`--fingerprint=<seed>`, `--fingerprint-noise=false`).

**Strengths**: Pairs naturally with rebrowser/patchright in a Node stack.

**Limitations**: Newer, less battle-tested.

**Verdict for Cloudflare**: Run **FlareSolverr in Docker** as an HTTP sidecar;
call it from Bun with `fetch` to obtain clearance cookies. For sites where
that fails, escalate to a real patched browser (rebrowser/patchright) with a
residential proxy.

---

## 5. Free CAPTCHA Solving Solutions

> Hard truth: there is **no reliable, free, fully self-hosted solver** for
> reCAPTCHA v2/v3, hCaptcha, or Cloudflare Turnstile in 2026. Open-source
> solvers exist for image CAPTCHAs (OCR/YOLO) but not for the token-based
> enterprise challenges job sites actually use.

### 5a. 2Captcha
| Field | Value |
|-------|-------|
| URL | https://2captcha.com |
| Free? | **No** - pay-as-you-go (~$0.50-$3/1k depending on type). Has a small balance for testing. |
| Node.js/Bun? | Yes - REST API, easy to call from Bun |

**How it works**: Human + AI hybrid. You submit the captcha (image, sitekey
+ URL for reCAPTCHA/hCaptcha/Turnstile); they return a token. ~12-30s for
reCAPTCHA v2.

### 5b. CapSolver
| Field | Value |
|-------|-------|
| URL | https://www.capsolver.com |
| Free? | **Free trial credit**: new users can request ~$0.50 free credit. Then pay-as-you-go (~$0.80/1k reCAPTCHA v2, ~$1.20/1k Turnstile). |
| Node.js/Bun? | Yes - REST API + official SDK |

**How it works**: AI-powered (neural models) automatic solver. Faster than
2Captcha (seconds, not tens of seconds). Supports reCAPTCHA v2/v3, hCaptcha,
Cloudflare Turnstile, AWS WAF, FunCaptcha, GeeTest.

### 5c. CaptchaAI
| Field | Value |
|-------|-------|
| URL | https://captchaai.com/trial |
| Free? | **3-day free trial**, 5 threads, unlimited solves. Then ~$15/mo. |
| Node.js/Bun? | Yes - 2Captcha-compatible API |

### 5d. Open-source / self-hosted attempts
| Project | URL | Notes |
|---------|-----|-------|
| OhMyCaptcha | https://github.com/shenhao-stu/ohmycaptcha | Self-hosted captcha-solving service, YesCaptcha-style async API, 19 task types. Mostly a wrapper/orchestrator, still needs upstream solvers. |
| Cap (trycap.dev) | https://github.com/tiagozip/cap | **This is for PROTECTING sites, not solving** - proof-of-work captcha alternative. Not useful for bypass. |
| ALTCHA | https://altcha.org | Same - protection tool, not a solver. |
| Image-OCR solvers (Yolov5 etc.) | various | Only work on legacy image-based captchas, not reCAPTCHA/Turnstile tokens. |

**Recommendation**: Budget for CapSolver or 2Captcha. Use the **free trial
credits** for development. Architect your agent so CAPTCHA-solving is a
rare fallback (good stealth + human behavior prevents most challenges from
even appearing), not the default path.

---

## 6. Simulating Human Behavior

### 6a. ghost-cursor (mouse movement) **[RECOMMENDED]**
| Field | Value |
|-------|-------|
| URL | https://github.com/Xetera/ghost-cursor |
| Variants | ghost-cursor (puppeteer), ghost-cursor-playwright, ghost-cursor-patchright-core |
| Free? | Yes - MIT |
| Node.js/Bun? | Yes |
| Stars | ~1.5k+ |

**How it works**: Generates realistic, Bezier-curve-based mouse movements
between coordinates or DOM elements. Mimics acceleration, overshoot, and
jitter. Works with both Puppeteer and Playwright (and Patchright via the
patchright-core variant).

**Usage**:
```ts
import { createCursor } from 'ghost-cursor-playwright';
const cursor = createCursor(page);
await cursor.move('#apply-button');
await cursor.click();
```

### 6b. puppeteer-extra-plugin-human-typing (typing)
| Field | Value |
|-------|-------|
| URL | https://github.com/0x7357/puppeteer-extra-plugin-human-typing |
| Free? | Yes |
| Node.js/Bun? | Yes |
| Stars | ~300+ |

**How it works**: Adds a `page.typeHuman()` method that humanizes typing with
per-key delays, typo simulation, and correction. The Medium writeup by Kuba
Gawronski calls it the most realistic Puppeteer typing tool.

### 6c. Manual humanization patterns (no library needed)
Implement these yourself for full control:
- **Random pre-action delays**: 800-3000ms uniform/gaussian jitter before clicks.
- **Random scroll**: `page.mouse.wheel({ deltaY: rand(100, 800) })` at random
  intervals; occasionally scroll back up.
- **Viewport jitter**: occasional tiny mouse moves that go nowhere.
- **Reading pauses**: longer pauses (5-20s) on "content" pages.
- **Tab/blur focus**: occasionally `page.evaluate(() => window.blur())`.
- **Realistic typing speed**: 80-200 WPM with per-character variance, occasional
  backspace-and-retype.
- **Click coordinate jitter**: never click the exact center; offset by
  +-5px random gaussian.

**Verdict**: Combine **ghost-cursor + human-typing plugin + manual delays**.
This trio dramatically reduces challenge frequency on most job sites.

---

## 7. Browser Fingerprint Randomization

### 7a. puppeteer-extra-plugin-stealth evasions (built-in)
Free, included. Covers: navigator.webdriver, plugins, languages, WebGL
vendor/renderer, chrome.runtime, permissions, iframe.contentWindow,
media codecs. Does NOT deeply randomize canvas/WebGL/audio fingerprints.

### 7b. Camoufox (Firefox-based anti-detect browser)
| Field | Value |
|-------|-------|
| URL | https://github.com/daijro/camoufox |
| Free? | Yes |
| Node.js/Bun? | **Python launcher** but the browser itself can be driven via Playwright over CDP. Runs in Docker. |
| Stars | ~7k+ |

**How it works**: A custom Firefox build that intercepts fingerprint data at
the **C++ implementation level** (not JS injection), so the spoofing is
undetectable by JS inspection. Spoofs canvas, WebGL, fonts, screen, etc.

**Strengths**: Strongest free fingerprint randomization available.
**Limitations**: Firefox-based (some sites behave differently); C++ patches
can lag Firefox upstream; the maintainers note recent fingerprint
inconsistencies (camoufox.com/stealth). Python launcher.

### 7c. CloakBrowser (see section 4c)
Stealth Chromium with `--fingerprint=<seed>` deterministic seeding +
`--fingerprint-noise` for canvas/WebGL/audio/client-rects. Pairs naturally
with Node automation.

### 7d. FingerprintJS (for TESTING, not spoofing)
| URL | https://github.com/fingerprintjs/fingerprintjs |
| Free? | Yes (open-source edition) / Paid (Pro) |
| Stars | ~22k |
**Important**: This is a *fingerprinting* library, not a spoofer. Use it to
**test whether your stealth setup actually produces a stable/unique
fingerprint** - visit `bot.sannysoft.com`, `creepjs`, `browserleaks.com`
in your automated browser and verify.

### 7e. Manual canvas/WebGL noise injection
For Playwright/Puppeteer, inject via `addInitScript`:
```ts
await context.addInitScript(() => {
  const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function (...args) {
    const ctx = this.getContext('2d');
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, this.width, this.height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] ^= 1; // tiny noise
      }
      ctx.putImageData(imageData, 0, 0);
    }
    return origToDataURL.apply(this, args);
  };
});
```
**Warning**: naive noise injection is itself detectable (Castle.io and
Scrapfly document detectors for it). Prefer a real anti-detect browser
(Camoufox / CloakBrowser) for high-stakes sites.

---

## 8. Residential Proxy - Free Alternatives

> Reality check: **truly free residential proxies do not exist as a reliable
> service.** Anything free is either (a) a datacenter proxy mislabeled,
> (b) a P2P pool of compromised devices (legally risky), or (c) a free trial
> that expires fast.

### 8a. Free tiers of paid providers
| Provider | Free offering | Notes |
|----------|---------------|-------|
| Bright Data | Web Scraping API: **~1k-5k records/month free** | Includes auto proxy rotation + anti-bot bypass + JS rendering. Best free option for low volume. |
| ScraperAPI | 5,000 free API credits/month | Rotating proxies + rendering. Good for prototyping. |
| Apify | $5 free platform credit on signup | Can spend on their proxy + scraper actors. |
| Webshare | 10 free proxies (datacenter) | Datacenter only, easily detected - not residential. |

### 8b. Free proxy lists (community-scraped)
| Source | URL | Notes |
|--------|-----|-------|
| TheSpeedX/PROXY-List | github topic "free-proxies-for-web-scraping" | 780k+ proxies scraped globally, verified hourly. |
| clarketm/proxy-list | GitHub | Curated free list. |
| free-proxy-list.net | web | Classic list. |

**Limitations of free lists**:
- Mostly **datacenter** IPs - instantly flagged by Cloudflare/DataDome.
- Very low uptime (often <10% work at any moment).
- No residential IPs - defeats the purpose.
- You must build your own validator/rotator.

### 8c. Build your own rotator
A Reddit Python library (r/Python, "free proxy rotator") scrapes + validates
free proxies and rotates them. Pattern to replicate in Bun:
1. Fetch lists from 3-4 GitHub sources on a cron.
2. Validate each against a test URL with a timeout.
3. Keep a pool of working proxies; rotate per request with health checks.
4. Accept ~90% failure rate - only useful for low-stakes scraping.

**Recommendation for an auto-application agent**: Do NOT rely on free proxies.
For real use, pay for Bright Data or ScraperAPI's low tier, or use the free
trial credits. Free proxy lists will get your accounts banned on job sites.

---

## 9. Legal Landscape of Job Board Scraping

### Key precedent: hiQ Labs v. LinkedIn (9th Circuit, 2022)
| Source | URL |
|--------|-----|
| Wikipedia summary | https://en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn |
| 9th Circuit opinion (PDF) | https://cdn.ca9.uscourts.gov/datastore/opinions/2022/04/18/17-16783.pdf |
| Analysis (calawyers.org) | https://calawyers.org/privacy-law/ninth-circuit-holds-data-scraping-is-legal-in-hiq-v-linkedin |

**Ruling**: The 9th Circuit held that scraping **public-facing** data from a
website does **not** violate the Computer Fraud and Abuse Act (CFAA), because
"without authorization" under CFAA does not include circumventing a
website's terms of service or a cease-and-desist letter when the data is
publicly accessible.

**What this means for an auto-application agent**:
- Scraping **public** job listings (no login required) is generally **not a
  federal crime** under CFAA in the 9th Circuit.
- BUT it can still violate the site's **Terms of Service** -> civil
  breach-of-contract risk, account bans, IP blocks.
- LinkedIn, Indeed, Glassdoor all prohibit scraping in their ToS.
- **Logging in and scraping** behind auth is much riskier - that's where
  CFAA "exceeding authorized access" arguments get stronger.
- hiQ itself eventually shut down after LinkedIn's other legal tactics
  (cost them millions even though they "won").

### Practical risk tiers for an auto-application agent
| Activity | Risk level |
|----------|-----------|
| Reading public ATS APIs (Greenhouse, Lever) | **Very low** - these are public, documented, intended for external use |
| Reading Indeed/LI public RSS or public listings | Low-medium (ToS violation, not criminal) |
| Logging into your own account and auto-applying | Medium (ToS violation; account ban risk; possible CFAA argument) |
| Scraping behind login at scale | High |
| Using stolen/free proxy pools of compromised devices | High (legally toxic) |

**Recommendation**: For an auto-application agent, the defensible path is:
1. **Discover** jobs via public ATS APIs and RSS (no ToS issue).
2. **Apply** through the ATS's official application endpoint or via a
   logged-in browser session you personally control, at human-scale volume.
3. Avoid scraping LinkedIn/Indeed behind login at scale.

---

## 10. RSS Feeds from Job Boards

### Indeed
| Field | Value |
|-------|-------|
| Status | **Killed then quietly revived.** Reddit (r/rss, "Indeed quietly kills their RSS feed"): Indeed removed RSS, then brought it back. |
| How to use | Take a normal search URL `indeed.com/jobs?q=...` and replace `jobs` with `rss` -> `indeed.com/rss?q=...`. |
| Caveat | Fragile - Indeed may remove it again without notice. Their Publisher Program (for structured API access) has been **paused since Oct 2022** with no new signups. |

### Upwork
| Field | Value |
|-------|-------|
| Status | **Discontinued August 20, 2024.** Officially gone. (gigradar.io confirms.) Reason: anti-circumvention against auto-bidding bots. |

### LinkedIn
No official RSS. Workarounds:
- **RSS.app** (https://rss.app): turn any LinkedIn job search into a custom
  RSS feed. Has a free tier with limits.
- **Feedly** job-feed integration (docs.feedly.com).

### Glassdoor
No official public RSS feed.

### Takeaway
RSS is unreliable across the big aggregators. The **stable** discovery path
is the ATS public APIs (next section) - those are designed to be consumed
externally and don't fight you.

---

## 11. ATS Public APIs (Greenhouse, Lever, Workday, etc.)

This is the **most valuable finding** for a job auto-application agent: most
modern companies host their careers on an ATS that exposes a **free, no-auth,
JSON API**. You can discover jobs without any anti-bot fighting at all.

### 11a. Greenhouse Job Board API **[BEST]**
| Field | Value |
|-------|-------|
| Docs | https://developers.greenhouse.io/job-board.html |
| Auth | **None** (read-only, public) |
| Format | JSON |
| Apply endpoint | Yes - multipart POST to submit applications |

**Endpoints** (per-company, via `boards.greenhouse.io/<company>`):
- `GET https://boards-api.greenhouse.io/v1/boards/<board_token>/jobs` - all jobs
- `GET .../jobs/<job_id>` - job detail
- `GET .../departments`, `.../offices`
- `POST .../boards/<board_token>/jobs/<job_id>/applications` - **submit application**

This is the single most useful integration: structured job data AND a
programmatic application submission path, both free and public.

### 11b. Lever
| Field | Value |
|-------|-------|
| Docs | https://github.com/lever/postings-api |
| Auth | None (public postings) |
| Endpoint | `GET https://api.lever.co/v0/postings/<company>?mode=json` |
| Apply | `POST https://api.lever.co/v0/postings/<posting_id>` (multipart form) |

### 11c. Ashby
| Field | Value |
|-------|-------|
| Docs | https://developers.ashbyhq.com/docs/public-job-posting-api |
| Auth | None for public postings |
| Endpoint | `POST https://api.ashbyhq.com/posting-api/job-board/<org>` (returns jobs) |

### 11d. Workable
- Public postings API per company. Endpoint pattern:
  `https://www.workable.com/spi/<company>/jobs` (json).

### 11e. Recruitee
- Endpoint: `https://<company>.recruitee.com/api/offers/` (json).

### 11f. SmartRecruiters
- Endpoint: `https://api.smartrecruiters.com/v1/companies/<company>/postings` (json).

### 11g. Personio
- Public job board API per company.

### 11h. Workday
| Field | Value |
|-------|-------|
| Docs | https://www.reddit.com/r/workday/comments/1gq6n15 (confirmed: Workday offers a public web service for job postings) |
| Auth | Public read |
| Pattern | Workday career sites expose a SOAP/REST job service. Most companies expose it at `<tenant>.wd1.myworkdayjobs.com/...` plus an underlying JSON endpoint used by the careers widget. |
| Aggregator | fantastic.jobs provides a unified Workday Jobs API; Apify has a "Career Site Job Listing API" covering 175k+ company sites across 54 ATS platforms. |

**Workday caveat**: Workday's official API is more enterprise-flavored (SOAP)
and each tenant configures it differently. In practice, scraping the
client-rendered JSON that powers the careers widget is easier than the
official API - but that drifts back into browser automation territory.

### Aggregator APIs (cover all ATSs at once)
| Provider | URL | Free? |
|----------|-----|-------|
| Apify ATS Jobs Scraper | https://apify.com/fetch_cat/ats-jobs-scraper | Free tier credits |
| Fantastic.jobs Career Site API | https://fantastic.jobs/article/ats-with-api | Free tier |
| JobsPipe | https://jobspipe.dev/sources/greenhouse | Free tier |
| TheirStack | https://theirstack.com/en/job-posting-api | Paid |
| LoopCV | https://www.loopcv.pro | Paid |

**Recommendation**: Build your job-discovery layer on **Greenhouse + Lever +
Ashby + Recruitee + SmartRecruiters + Workable + Personio** public APIs
first. These cover a large fraction of tech-company job postings, require
zero anti-bot work, and several even let you **submit applications
programmatically** (Greenhouse, Lever). This should be the backbone of the
agent; reserve browser automation for sites with no API.

---

## 12. Bonus: Crawlee (orchestration framework)
| Field | Value |
|-------|-------|
| URL | https://github.com/apify/crawlee |
| Docs | https://crawlee.dev |
| Free? | Yes - Apache 2.0 |
| Node.js/Bun? | Yes (native TS/JS; Python version also exists) |
| Stars | ~16k |

**Why it matters**: Crawlee is a full scraping framework by Apify that
**integrates puppeteer-extra-plugin-stealth out of the box**, handles request
queues, retries, proxy rotation, sessions, and storage. It is the natural
orchestration layer for a Node/Bun auto-application agent. Official example
shows combining Crawlee + Puppeteer Stealth + Playwright.

---

## 13. Implementation Roadmap for Next.js + Bun

### Phase 1 - API-first discovery (zero anti-bot, ship in days)
1. Build a job-discovery service that calls Greenhouse, Lever, Ashby,
   Recruitee, SmartRecruiters, Workable, Personio public APIs.
2. For Greenhouse/Lever, also implement the **application submission**
   endpoint (multipart POST) - this alone could auto-apply to thousands of
   companies with zero browser automation.
3. Add Indeed RSS (`indeed.com/rss?q=...`) as a secondary feed with graceful
   failure handling.

### Phase 2 - Light stealth for ATS without apply APIs
1. Use **rebrowser-playwright** (or patchright-nodejs) as your browser layer.
2. Add **ghost-cursor-playwright** for mouse movement.
3. Add **human-typing plugin** or manual typing delays for form fills.
4. Inject fingerprint evasions via `addInitScript`.
5. Run a Bun job queue (BullMQ or native) that applies at human-scale rates
   (e.g. max 20-50 apps/day per user, random gaps).

### Phase 3 - Hard-target fallback
1. Stand up **FlareSolverr in Docker** as an HTTP sidecar; call from Bun via
   `fetch` to get Cloudflare clearance cookies.
2. If Turnstile/CAPTCHA appears, escalate to **CapSolver** API (use the
   $0.50 free credit for dev; budget ~$0.80-1.20 per 1k solves in prod).
3. For fingerprint-sensitive sites, run **CloakBrowser** or **Camoufox**
   (Docker) driven over CDP from your Bun process.

### Phase 4 - Proxies (only if blocked)
1. Start with **Bright Data / ScraperAPI free tiers** for low-volume needs.
2. Only upgrade to paid residential proxies once free tiers are exhausted and
   blocks are confirmed IP-based (not behavior/fingerprint based).

### Phase 5 - Legal & safety guardrails
1. Rate-limit aggressively (human-scale).
2. Only apply on behalf of users who have explicitly authenticated their own
   accounts - never create fake accounts.
3. Keep an audit log; respect robots.txt for discovery crawls.
4. Prefer public ATS APIs over logged-in scraping wherever possible.

---

## 14. Quick Reference - All Tools at a Glance

| # | Tool | Free? | Node/Bun? | Best for |
|---|------|-------|-----------|----------|
| 1 | puppeteer-extra-plugin-stealth | Yes | Yes | Baseline evasion (low-defense sites) |
| 2 | rebrowser-playwright | Yes | Yes | Modern CDP-leak-aware stealth |
| 3 | patchright-nodejs | Yes | Yes | Alt to rebrowser |
| 4 | undetected-chromedriver | Yes | No (Python) | Selenium/Python stacks |
| 5 | nodriver | Yes | No (Python) | Python no-webdriver automation |
| 6 | FlareSolverr | Yes | Yes (HTTP API) | Cloudflare IUAM bypass |
| 7 | cloudscraper | Yes | No (Python) | Legacy Cloudflare JS challenge |
| 8 | CloakBrowser | Free tier | Yes (CDP) | Fingerprint randomization |
| 9 | Camoufox | Yes | Partial (Python launcher) | C++-level fingerprint spoofing |
| 10 | ghost-cursor | Yes | Yes | Human mouse movement |
| 11 | human-typing plugin | Yes | Yes | Human typing simulation |
| 12 | 2Captcha | No | Yes (API) | CAPTCHA solving |
| 13 | CapSolver | Trial credit | Yes (API) | Fast AI CAPTCHA solving |
| 14 | CaptchaAI | 3-day trial | Yes (API) | Flat-rate CAPTCHA solving |
| 15 | Bright Data | Free tier | Yes (API) | Scraping API + proxies |
| 16 | ScraperAPI | 5k free | Yes (API) | Rotating proxies |
| 17 | Crawlee | Yes | Yes | Scraping orchestration framework |
| 18 | Greenhouse API | Yes | Yes | Job discovery + application |
| 19 | Lever API | Yes | Yes | Job discovery + application |
| 20 | Ashby API | Yes | Yes | Job discovery |
| 21 | Indeed RSS | Yes | Yes | Fragile secondary feed |

---

## Sources (key URLs)
- https://github.com/berstend/puppeteer-extra
- https://github.com/rebrowser/rebrowser-patches
- https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-nodejs
- https://github.com/ultrafunkamsterdam/undetected-chromedriver
- https://github.com/ultrafunkamsterdam/nodriver
- https://github.com/Flaresolverr/FlareSolverr
- https://github.com/VeNoMouS/cloudscraper
- https://github.com/Xetera/ghost-cursor
- https://github.com/0x7357/puppeteer-extra-plugin-human-typing
- https://github.com/daijro/camoufox
- https://github.com/CloakHQ/cloakbrowser
- https://github.com/apify/crawlee
- https://github.com/fingerprintjs/fingerprintjs
- https://developers.greenhouse.io/job-board.html
- https://developers.ashbyhq.com/docs/public-job-posting-api
- https://www.capsolver.com
- https://2captcha.com
- https://captchaai.com/trial
- https://en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn
- https://crawlee.dev
- https://fantastic.jobs/article/ats-with-api
- https://cavuno.com/blog/ats-platforms-public-job-posting-apis
