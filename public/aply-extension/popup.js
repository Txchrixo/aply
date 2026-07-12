import { api, clearSession, getConfig, setSession, DEFAULT_DASHBOARD } from "./shared.js";

const $ = (id) => document.getElementById(id);

function showToast(el, message, isError = false) {
  el.textContent = message;
  el.classList.toggle("error", isError);
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 4200);
}

async function requireSession() {
  const cfg = await getConfig();
  if (!cfg.token) return null;
  try {
    const me = await api("/api/auth/me");
    return { ...cfg, user: me.user };
  } catch (e) {
    if (e.status === 401) await clearSession();
    return null;
  }
}

function setConnection(online, monitoring) {
  const pill = $("conn-pill");
  const text = $("conn-text");
  pill.classList.toggle("is-off", !online);
  if (!online) text.textContent = "Offline";
  else text.textContent = monitoring ? "Live" : "Paused";
}

function renderApprovals(items) {
  const root = $("approvals");
  $("pending-count").textContent = items.length ? ` · ${items.length}` : "";

  if (!items.length) {
    root.innerHTML = `<div class="empty">No drafts waiting. Capture a job page to create one.</div>`;
    return;
  }

  root.innerHTML = items
    .slice(0, 5)
    .map((app) => {
      const title = app.jobOffer?.title || "Untitled role";
      const company = app.jobOffer?.company || "Company";
      const platform = app.jobOffer?.platform?.name || "Captured";
      const score = app.qualityScore != null ? Math.round(app.qualityScore * 100) : null;
      const preview = (app.coverLetter || "").replace(/\s+/g, " ").trim();
      return `
        <article class="item" data-id="${app.id}">
          <div class="item-title">${escapeHtml(title)}</div>
          <div class="item-meta">${escapeHtml(company)} · ${escapeHtml(platform)}</div>
          ${preview ? `<div class="item-preview">${escapeHtml(preview)}</div>` : ""}
          <div class="item-actions">
            <button class="btn btn-primary btn-tiny" data-action="approve">Approve</button>
            <button class="btn btn-quiet" data-action="reject">Reject</button>
            ${score != null ? `<span class="score">${score}%</span>` : ""}
          </div>
        </article>`;
    })
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function loadDashboard() {
  const [stats, apps] = await Promise.all([
    api("/api/stats"),
    api("/api/applications?status=pending_approval&pageSize=5"),
  ]);

  $("stat-pending").textContent = String(stats.pendingApprovals ?? 0);
  $("stat-offers").textContent = String(stats.newOffers ?? 0);
  $("stat-submitted").textContent = String(stats.submittedTotal ?? 0);
  setConnection(true, Boolean(stats.monitoringEnabled));
  renderApprovals(apps.items || []);
}

async function showApp(session) {
  $("view-login").classList.add("hidden");
  $("view-app").classList.remove("hidden");
  $("dashboard-link").href = session.dashboard || DEFAULT_DASHBOARD;

  try {
    await loadDashboard();
  } catch (e) {
    setConnection(false, false);
    showToast($("app-toast"), e.message || "Could not reach dashboard", true);
    renderApprovals([]);
  }
}

function showLogin(prefillDashboard) {
  $("view-app").classList.add("hidden");
  $("view-login").classList.remove("hidden");
  if (prefillDashboard) $("dashboard").value = prefillDashboard;
}

async function init() {
  const cfg = await getConfig();
  $("dashboard").value = cfg.dashboard || DEFAULT_DASHBOARD;

  const session = await requireSession();
  if (session) await showApp(session);
  else showLogin(cfg.dashboard);
}

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("login-btn");
  const email = $("email").value.trim();
  const password = $("password").value;
  const dashboard = ($("dashboard").value.trim() || DEFAULT_DASHBOARD).replace(/\/$/, "");

  btn.disabled = true;
  btn.textContent = "Signing in…";
  try {
    await chrome.storage.local.set({ dashboard });
    const data = await api("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    await setSession({
      token: data.token,
      email: data.user?.email || email,
      userName: data.user?.name,
    });
    await showApp({
      dashboard,
      email: data.user?.email || email,
      user: data.user,
    });
  } catch (err) {
    showToast($("login-toast"), err.message || "Sign in failed", true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign in";
  }
});

$("logout-btn").addEventListener("click", async () => {
  await clearSession();
  const cfg = await getConfig();
  showLogin(cfg.dashboard);
});

$("refresh-btn").addEventListener("click", async () => {
  try {
    await loadDashboard();
    showToast($("app-toast"), "Synced with dashboard");
  } catch (e) {
    setConnection(false, false);
    showToast($("app-toast"), e.message || "Refresh failed", true);
  }
});

$("capture-btn").addEventListener("click", () => {
  const btn = $("capture-btn");
  btn.disabled = true;
  btn.textContent = "Capturing…";
  chrome.runtime.sendMessage({ type: "APLY_CAPTURE_ACTIVE_TAB" }, async (resp) => {
    btn.disabled = false;
    btn.textContent = "Capture page";
    if (chrome.runtime.lastError || !resp?.ok) {
      showToast($("app-toast"), resp?.error || chrome.runtime.lastError?.message || "Capture failed", true);
      return;
    }
    showToast(
      $("app-toast"),
      resp.data?.applicationId
        ? `Captured “${resp.data.title}” — draft ready`
        : `Captured “${resp.data?.title || "offer"}”`
    );
    try {
      await loadDashboard();
    } catch {
      /* ignore */
    }
  });
});

$("fill-btn").addEventListener("click", () => {
  const btn = $("fill-btn");
  btn.disabled = true;
  btn.textContent = "Filling…";
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) {
      btn.disabled = false;
      btn.textContent = "Fill form";
      showToast($("app-toast"), "No active tab", true);
      return;
    }
    chrome.tabs.sendMessage(tab.id, { type: "APLY_FILL_FORM" }, (resp) => {
      btn.disabled = false;
      btn.textContent = "Fill form";
      if (chrome.runtime.lastError) {
        showToast($("app-toast"), "Open a job application page first", true);
        return;
      }
      if (resp?.ok) showToast($("app-toast"), `Filled ${resp.filled ?? 0} fields`);
      else showToast($("app-toast"), resp?.error || "Could not fill form", true);
    });
  });
});

$("approvals").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const card = btn.closest(".item");
  const id = card?.dataset.id;
  if (!id) return;

  const action = btn.dataset.action;
  btn.disabled = true;
  try {
    if (action === "approve") {
      await api(`/api/applications/${id}/approve`, {
        method: "POST",
        body: { channel: "extension" },
      });
      showToast($("app-toast"), "Approved & marked submitted");
    } else {
      await api(`/api/applications/${id}/reject`, {
        method: "POST",
        body: { reason: "Rejected from extension" },
      });
      showToast($("app-toast"), "Rejected");
    }
    await loadDashboard();
  } catch (err) {
    showToast($("app-toast"), err.message || "Action failed", true);
    btn.disabled = false;
  }
});

init();
