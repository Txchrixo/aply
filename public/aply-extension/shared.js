/** Shared storage + API helpers for the Aply extension (ES module). */

export const DEFAULT_DASHBOARD = "http://localhost:4000";

export async function getConfig() {
  const stored = await chrome.storage.local.get([
    "dashboard",
    "token",
    "email",
    "userName",
    "whatsapp",
    "notifyEmail",
  ]);
  const dashboard = String(stored.dashboard || DEFAULT_DASHBOARD).replace(/\/$/, "");
  return {
    dashboard,
    token: stored.token || null,
    email: stored.email || null,
    userName: stored.userName || null,
    whatsapp: stored.whatsapp || "",
    notifyEmail: stored.notifyEmail || "",
  };
}

export async function setSession({ token, email, userName }) {
  await chrome.storage.local.set({
    token,
    email,
    userName: userName || (email ? email.split("@")[0] : ""),
  });
}

export async function clearSession() {
  await chrome.storage.local.remove(["token", "email", "userName"]);
}

export async function api(path, { method = "GET", body, auth = true } = {}) {
  const { dashboard, token } = await getConfig();
  const headers = { "Content-Type": "application/json" };
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${dashboard}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function notify(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon-128.png",
    title,
    message,
  });
}
