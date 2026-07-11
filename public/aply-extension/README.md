# Aply · Chrome Extension (Manifest V3)

## Install locally (developer mode)

1. Open Chrome and go to `chrome://extensions`
2. Toggle **Developer mode** ON (top-right)
3. Click **Load unpacked**
4. Select this `aply-extension/` folder
5. The Aply icon appears in your toolbar.

## How to use

### Capture a job offer
1. Browse any job board (Indeed, LinkedIn, Welcome to the Jungle, …)
2. Open the job offer page you want to apply to
3. **Right-click** anywhere on the page → **Aply: capture this job offer**
4. Aply sends the page to your local dashboard (`http://localhost:3000`),
   extracts the structured fields with GLM, and drafts a cover letter.

### Auto-fill an application form
1. Open the application form page on the job board
2. **Right-click** → **Aply: auto-fill this application form**
3. Aply detects input fields, asks the dashboard for values, and fills them.
4. Aply NEVER submits on its own · review and submit yourself, or approve via
   the dashboard / WhatsApp / email.

## Options
Click the extension icon → **Options** to set:
- Dashboard URL (default `http://localhost:3000`)
- WhatsApp number for approval requests
- Email for approval requests

## Permissions explained
- `contextMenus` · the right-click "Aply" entries
- `activeTab` + `scripting` · read the page text / fill the form on the active tab
- `storage` · save your options
- `notifications` · confirm captures
- `<all_urls>` host permission · Aply must work on every job board

## Notes
- The dashboard (Next.js app on port 3000) must be running.
- For sites behind login (LinkedIn, Welcome to the Jungle, …), simply be logged
  in in your Chrome · Aply reuses your session cookies.
