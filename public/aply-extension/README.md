# Aply · Chrome Extension (Manifest V3)

## Install locally (developer mode)

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this `aply-extension/` folder
   (or download a fresh ZIP from the dashboard and unzip first)
4. Pin the Aply icon in the toolbar

## Sign in

1. Click the Aply icon
2. Enter any demo email + password (4+ chars)
3. Set Dashboard URL (default `http://localhost:4000`)
4. The popup becomes a mini dashboard once connected

## What you can do

| Action | Where |
|--------|--------|
| Capture job offer + draft cover letter | Popup **Capture page** or right-click → *Aply: capture* |
| Auto-fill application forms | Popup **Fill form** or right-click → *Aply: auto-fill* |
| Approve / reject pending drafts | Popup approvals list |
| Open full dashboard | Popup **Open dashboard** |
| Change backend URL | Right-click icon → Options |

## Requirements

- Aply Next.js dashboard running (default port **4000**)
- A default resume uploaded in the dashboard (needed for drafts + fill)
- For logged-in job boards (LinkedIn, WTTJ…), stay logged in in Chrome — Aply reuses your session

## Permissions

- `contextMenus` · right-click actions
- `activeTab` + `scripting` · read page / fill fields
- `storage` · session token + options
- `notifications` · capture confirmations
- `<all_urls>` · works on every job board
