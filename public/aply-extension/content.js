// Aply - content script
// Detects and fills job application forms with high precision.
// Handles field variations across different ATS systems (Greenhouse, Lever, Workday, etc.)

(() => {
  // Field type detection patterns
  const FIELD_PATTERNS = {
    full_name: [
      /name/i, /full.?name/i, /nom complet/i, /vorname/i, /nachname/i,
    ],
    first_name: [/first.?name/i, /pr[ée]nom/i, /vorname/i],
    last_name: [/last.?name/i, /nom/i, /nachname/i, /surname/i],
    email: [/email/i, /e.?mail/i, /courriel/i, /mail/i],
    phone: [/phone/i, /t[ée]l[ée]/i, /mobile/i, /tel/i, /handy/i],
    linkedin: [/linkedin/i, /profil.*url/i],
    github: [/github/i, /gitlab/i],
    portfolio: [/portfolio/i, /website/i, /site web/i, /personal.*url/i],
    cover_letter: [/cover.?letter/i, /lettre.*motivation/i, /anschreiben/i, /motivation/i],
    resume: [/resume/i, /cv/i, /curriculum/i, /lebenslauf/i],
    salary: [/salary/i, /salaire/i, /r[ée]mun[ée]ration/i, /gehalt/i, /rate/i, /tarif/i],
    start_date: [/start.?date/i, /disponibilit/i, /verf[üg]gbar/i, /when.*start/i],
    work_auth: [/authorized.*work/i, /work.*auth/i, /autorisation.*travail/i, /arbeitserlaubnis/i],
    experience: [/experience/i, /exp[ée]rience/i, /erfahrung/i, /how many years/i],
    why: [/why.*interested/i, /pourquoi.*cette.*offre/i, /warum.*interessiert/i],
    education: [/education/i, /dipl[ôo]me/i, /bildung/i, /degree/i, /qualif/i],
  };

  // ATS-specific selector hints
  const ATS_SELECTORS = {
    greenhouse: {
      name: "input[name='first_name'], input[name='last_name']",
      email: "input[name='email']",
      phone: "input[name='phone']",
      resume: "input[type='file']",
      cover_letter: "textarea[name='cover_letter']",
    },
    lever: {
      name: "input[name='name']",
      email: "input[name='email']",
      phone: "input[name='phone']",
      resume: "input[type='file']",
      cover_letter: "textarea",
    },
    workday: {
      name: "input[data-automation-id='firstName'], input[data-automation-id='lastName']",
      email: "input[data-automation-id='email']",
      phone: "input[data-automation-id='phone']",
    },
  };

  // Detect which ATS we're on
  function detectAts() {
    const url = location.href.toLowerCase();
    const html = document.documentElement.outerHTML.toLowerCase();

    if (url.includes("greenhouse.io") || html.includes("greenhouse")) return "greenhouse";
    if (url.includes("lever.co") || html.includes("lever")) return "lever";
    if (url.includes("workday") || url.includes("myworkdayjobs")) return "workday";
    if (url.includes("ashbyhq.com")) return "ashby";
    if (url.includes("smartrecruiters")) return "smartrecruiters";
    return "generic";
  }

  // Find the label for a form field
  function findLabel(el) {
    // Try explicit <label for>
    if (el.id) {
      const lbl = document.querySelector(`label[for="${el.id}"]`);
      if (lbl) return lbl.textContent.trim();
    }
    // Try parent <label>
    const parentLabel = el.closest("label");
    if (parentLabel) return parentLabel.textContent.trim();
    // Try aria-label
    if (el.getAttribute("aria-label")) return el.getAttribute("aria-label");
    // Try aria-labelledby
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const lbl = document.getElementById(labelledBy);
      if (lbl) return lbl.textContent.trim();
    }
    // Try placeholder
    if (el.getAttribute("placeholder")) return el.getAttribute("placeholder");
    // Try preceding sibling text
    const prev = el.previousElementSibling;
    if (prev && prev.textContent.trim()) return prev.textContent.trim();
    // Try data attributes
    if (el.getAttribute("data-automation-id")) return el.getAttribute("data-automation-id");
    if (el.getAttribute("data-testid")) return el.getAttribute("data-testid");
    return "";
  }

  // Classify a field based on its label, name, id, and type
  function classifyField(el) {
    const label = (findLabel(el) || "").toLowerCase();
    const name = (el.getAttribute("name") || "").toLowerCase();
    const id = (el.id || "").toLowerCase();
    const placeholder = (el.getAttribute("placeholder") || "").toLowerCase();
    const combined = `${label} ${name} ${id} ${placeholder}`;

    for (const [fieldKey, patterns] of Object.entries(FIELD_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(combined)) {
          return fieldKey;
        }
      }
    }
    return null;
  }

  // Detect all form fields on the page
  function detectFormFields() {
    const fields = [];
    const inputs = document.querySelectorAll("input, textarea, select");

    inputs.forEach((el) => {
      // Skip hidden, submit, button inputs
      const type = (el.getAttribute("type") || el.tagName.toLowerCase()).toLowerCase();
      if (["hidden", "submit", "button", "image", "reset"].includes(type)) return;
      if (el.offsetParent === null && type !== "file") return; // skip invisible (except file inputs)

      const fieldKey = classifyField(el);
      const label = findLabel(el);
      const name = el.getAttribute("name") || el.id || "";
      const selector = el.id
        ? `#${el.id}`
        : name
        ? `[name="${name}"]`
        : el.className
        ? `.${el.className.split(" ")[0]}`
        : null;

      if (!selector) return;

      fields.push({
        selector,
        name,
        label,
        type,
        fieldKey: fieldKey || "unknown",
        required: el.hasAttribute("required") || el.getAttribute("aria-required") === "true",
        options:
          el.tagName === "SELECT"
            ? Array.from(el.querySelectorAll("option")).map((o) => o.textContent.trim())
            : null,
      });
    });

    return fields;
  }

  // Fill a single field with a value, properly triggering events
  function fillField(el, value, filePayload) {
    const tagName = el.tagName.toLowerCase();

    if (tagName === "textarea") {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set;
      setter?.call(el, value);
    } else if (tagName === "select") {
      el.value = value;
    } else if (el.getAttribute("type") === "checkbox" || el.getAttribute("type") === "radio") {
      el.checked = true;
    } else if (el.getAttribute("type") === "file") {
      if (!filePayload?.base64) {
        console.log("%c[Aply] Resume file missing — upload a PDF in the dashboard", "color:#C65D00");
        return false;
      }
      try {
        const binary = atob(filePayload.base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const file = new File([bytes], filePayload.fileName || "resume.pdf", {
          type: filePayload.mimeType || "application/pdf",
        });
        const dt = new DataTransfer();
        dt.items.add(file);
        el.files = dt.files;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      } catch (err) {
        console.warn("[Aply] Could not set resume file input", err);
        return false;
      }
    } else {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      setter?.call(el, value);
    }

    // Trigger events that frameworks listen to
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    return true;
  }

  // Fill all detected fields with values from the Aply backend
  function fillFields(values) {
    let filled = 0;
    let skipped = 0;

    values.forEach((v) => {
      let el = null;
      try {
        el = document.querySelector(v.selector);
      } catch {
        el = null;
      }

      if (!el) {
        // Try by field key as fallback
        if (v.fieldKey) {
          const ats = detectAts();
          const atsSelectors = ATS_SELECTORS[ats];
          if (atsSelectors && atsSelectors[v.fieldKey]) {
            try {
              el = document.querySelector(atsSelectors[v.fieldKey]);
            } catch {
              el = null;
            }
          }
        }
      }

      if (!el && v.file) {
        try {
          el = document.querySelector("input[type='file']");
        } catch {
          el = null;
        }
      }

      if (!el) {
        skipped++;
        return;
      }

      if (fillField(el, v.value, v.file)) {
        filled++;
      } else {
        skipped++;
      }
    });

    return { filled, skipped };
  }

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "APLY_FILL_FORM") {
      const fields = detectFormFields();
      if (fields.length === 0) {
        sendResponse({ ok: false, error: "No form fields detected on this page." });
        return;
      }

      // Send detected fields to background (which forwards to Aply backend)
      chrome.runtime.sendMessage(
        { type: "APLY_FORM_DETECTED", fields, url: location.href, ats: detectAts() },
        (resp) => {
          if (resp?.ok && resp.values) {
            const result = fillFields(resp.values);
            sendResponse({ ok: true, ...result });
          } else {
            sendResponse({ ok: false, error: resp?.error ?? "no values" });
          }
        }
      );
      return true; // keep channel open
    }

    if (msg.type === "APLY_DETECT_FIELDS") {
      const fields = detectFormFields();
      const ats = detectAts();
      sendResponse({ ok: true, fields, ats, count: fields.length });
      return;
    }
  });

  // Signal that Aply is active
  console.log(
    "%cAply active",
    "color:#C65D00;font-weight:600;font-size:14px"
  );
  console.log(
    "%cDetected ATS: " + detectAts(),
    "color:#79695E;font-size:12px"
  );
})();
