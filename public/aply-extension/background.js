// Aply · background service worker (Manifest V3)
// Responsibilities:
//   - register the right-click context menu to capture job offers
//   - relay captured offers to the Aply local backend (port 3000)
//   - listen for approval responses and trigger form-fill on the tab

const APLY_DASHBOARD = "http://localhost:3000";

// ---- Context menu registration ----
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "aply-capture-job",
    title: "Aply: capture this job offer",
    contexts: ["page", "selection", "link"],
  });
  chrome.contextMenus.create({
    id: "aply-fill-form",
    title: "Aply: auto-fill this application form",
    contexts: ["page"],
  });
});

// ---- Context menu clicks ----
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === "aply-capture-job") {
    // Extract the page text via content script
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText.slice(0, 12000),
    });
    const payload = {
      url: info.pageUrl || tab.url,
      title: tab.title,
      rawHtml: result,
      capturedAt: new Date().toISOString(),
    };
    // Send to Aply backend
    try {
      const res = await fetch(`${APLY_DASHBOARD}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon-128.png",
        title: "Aply · offer captured",
        message: `Saved: ${data.title ?? payload.title}. Aply is drafting your cover letter.`,
      });
    } catch (e) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon-128.png",
        title: "Aply · capture failed",
        message: "Is the Aply dashboard running on port 3000?",
      });
    }
  }

  if (info.menuItemId === "aply-fill-form") {
    // Ask the content script to detect & fill form fields
    chrome.tabs.sendMessage(tab.id, { type: "APLY_FILL_FORM" });
  }
});

// ---- Messages from content script / popup ----
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "APLY_FORM_DETECTED") {
    // Forward form fields to backend to get pre-filled values
    fetch(`${APLY_DASHBOARD}/api/extension/fill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: msg.fields, url: msg.url }),
    })
      .then((r) => r.json())
      .then((data) => sendResponse({ ok: true, values: data.values }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true; // keep channel open for async
  }
});
