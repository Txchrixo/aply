/**
 * GET /api/extension
 * Returns metadata + the list of files that make up the Aply Chrome extension,
 * plus install instructions. The actual files live under /aply-extension/*
 * in the public folder so they can be served statically.
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "Aply · Chrome Extension",
    version: "0.2.0",
    manifestUrl: "/aply-extension/manifest.json",
    files: [
      "/aply-extension/manifest.json",
      "/aply-extension/background.js",
      "/aply-extension/content.js",
      "/aply-extension/popup.html",
      "/aply-extension/popup.js",
      "/aply-extension/shared.js",
      "/aply-extension/options.html",
      "/aply-extension/README.md",
      "/aply-extension/icons/icon-16.png",
      "/aply-extension/icons/icon-48.png",
      "/aply-extension/icons/icon-128.png",
      "/aply-extension/_locales/en/messages.json",
    ],
    installSteps: [
      "Open chrome://extensions in Chrome (or any Chromium browser).",
      "Toggle 'Developer mode' ON (top-right corner).",
      "Click 'Load unpacked' and select the aply-extension/ folder.",
      "Open the popup and sign in (demo: any email + password).",
      "Set Dashboard URL to http://localhost:4000 if needed.",
      "Capture jobs, fill forms, and approve drafts from the popup.",
    ],
    permissions: [
      "contextMenus · the right-click Aply entries",
      "activeTab + scripting · read/fill the active page",
      "storage · save your options",
      "notifications · confirm captures",
      "<all_urls> host · Aply works on every job board",
    ],
  });
}
