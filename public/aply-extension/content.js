// Aply · content script
// Injected on every page. Detects application forms and can fill them on demand.

(() => {
  // Heuristic: detect common job-application form fields
  function detectFormFields() {
    const fields = [];
    const inputs = document.querySelectorAll(
      "input, textarea, select"
    );
    inputs.forEach((el) => {
      const name =
        el.getAttribute("name") ||
        el.getAttribute("id") ||
        el.getAttribute("placeholder") ||
        el.getAttribute("aria-label") ||
        "";
      const type = el.getAttribute("type") || el.tagName.toLowerCase();
      const label = findLabel(el);
      if (!name && !label) return;
      fields.push({
        selector: el.id ? `#${el.id}` : `[name="${el.getAttribute("name") ?? ""}"]`,
        name,
        type,
        label,
        required: el.hasAttribute("required"),
      });
    });
    return fields;
  }

  function findLabel(el) {
    if (el.id) {
      const lbl = document.querySelector(`label[for="${el.id}"]`);
      if (lbl) return lbl.innerText.trim();
    }
    const parent = el.closest("label");
    if (parent) return parent.innerText.trim();
    const aria = el.getAttribute("aria-label");
    if (aria) return aria;
    return "";
  }

  // Fill fields with provided values
  function fillFields(values) {
    let filled = 0;
    values.forEach((v) => {
      let el;
      try {
        el = document.querySelector(v.selector);
      } catch {
        el = null;
      }
      if (!el) return;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      const setterTa = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set;
      if (el.tagName === "TEXTAREA" && setterTa) {
        setterTa.call(el, v.value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        filled++;
      } else if (el.tagName === "INPUT" && setter) {
        setter.call(el, v.value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        filled++;
      } else if (el.tagName === "SELECT") {
        el.value = v.value;
        el.dispatchEvent(new Event("change", { bubbles: true }));
        filled++;
      }
    });
    return filled;
  }

  // Listen for fill commands from the background
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "APLY_FILL_FORM") {
      const fields = detectFormFields();
      if (fields.length === 0) {
        sendResponse({ ok: false, error: "No form fields detected on this page." });
        return;
      }
      // Ask background (which asks Aply backend) for values
      chrome.runtime.sendMessage(
        { type: "APLY_FORM_DETECTED", fields, url: location.href },
        (resp) => {
          if (resp?.ok && resp.values) {
            const n = fillFields(resp.values);
            sendResponse({ ok: true, filled: n });
          } else {
            sendResponse({ ok: false, error: resp?.error ?? "no values" });
          }
        }
      );
      return true;
    }
  });

  // Signal that Aply is active on this page (small badge)
  console.log("%cAply active on this page.", "color:#C65D00;font-weight:600");
})();
