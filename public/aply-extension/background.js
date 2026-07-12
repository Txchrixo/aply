// Aply · background service worker (Manifest V3)
import { api, getConfig, notify } from "./shared.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
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
});

async function captureTab(tab, pageUrl) {
  if (!tab?.id) throw new Error("No active tab");
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.body.innerText.slice(0, 12000),
  });

  const data = await api("/api/jobs", {
    method: "POST",
    body: {
      url: pageUrl || tab.url,
      title: tab.title,
      rawHtml: result,
      capturedAt: new Date().toISOString(),
    },
  });

  const label = data.title || tab.title || "Offer";
  notify(
    data.duplicate ? "Aply · already captured" : "Aply · offer captured",
    data.applicationId
      ? `${label} — draft ready for approval`
      : `${label} — saved to dashboard`
  );
  return data;
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === "aply-capture-job") {
    try {
      await captureTab(tab, info.pageUrl || tab.url);
    } catch (e) {
      const { dashboard } = await getConfig();
      notify(
        "Aply · capture failed",
        e?.status === 401
          ? "Sign in from the Aply extension popup first."
          : `Is the dashboard running at ${dashboard}?`
      );
    }
  }

  if (info.menuItemId === "aply-fill-form") {
    chrome.tabs.sendMessage(tab.id, { type: "APLY_FILL_FORM" });
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "APLY_FORM_DETECTED") {
    api("/api/extension/fill", {
      method: "POST",
      body: { fields: msg.fields, url: msg.url, ats: msg.ats },
    })
      .then((data) => sendResponse({ ok: true, values: data.values || [], filledCount: data.filledCount }))
      .catch((e) => sendResponse({ ok: false, error: e?.message || String(e) }));
    return true;
  }

  if (msg.type === "APLY_CAPTURE_ACTIVE_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      try {
        const tab = tabs[0];
        const data = await captureTab(tab, tab?.url);
        sendResponse({ ok: true, data });
      } catch (e) {
        sendResponse({ ok: false, error: e?.message || String(e) });
      }
    });
    return true;
  }

  if (msg.type === "APLY_GET_CONFIG") {
    getConfig().then((cfg) => sendResponse(cfg));
    return true;
  }
});
