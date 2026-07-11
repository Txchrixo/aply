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
    version: "0.1.0",
    manifestUrl: "/aply-extension/manifest.json",
    files: [
      "/aply-extension/manifest.json",
      "/aply-extension/background.js",
      "/aply-extension/content.js",
      "/aply-extension/popup.html",
      "/aply-extension/options.html",
      "/aply-extension/README.md",
    ],
    installSteps: [
      "Open chrome://extensions in Chrome (or any Chromium browser).",
      "Toggle 'Developer mode' ON (top-right corner).",
      "Click 'Load unpacked' and select the aply-extension/ folder.",
      "The Aply icon appears in your toolbar · pin it for easy access.",
      "Right-click any job offer page → 'Aply: capture this job offer'.",
      "Right-click any application form → 'Aply: auto-fill this application form'.",
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
