# Xelector

**Xelector** is a production-ready Chrome extension that extracts structured data from web pages using configurable CSS selectors, formats the output, and copies it to the clipboard. It is designed for freelancers, researchers, and power users who need to quickly gather and reuse web content.

---

## Technical Architecture

Xelector is built on **Chrome Extension Manifest V3** and follows a modular, service-oriented architecture:

- **Background Service Worker** (`src/extension/background.js`)  
  Handles offscreen clipboard operations using the Offscreen API, formats extraction output, and persists the last extraction result.

- **Content Scripts** (`src/extension/content-script.js`)  
  Injected into web pages to perform DOM queries, extract values based on active profile selectors, and render a floating toolbar for manual extractions.

- **Popup / Options UI** (`src/ui/management/`)  
  A single-page management interface (`index.html`, `styles.css`, `app.js`) for creating, editing, importing, and exporting extraction profiles.

- **Storage Layer**  
  Uses `chrome.storage.local` for profile persistence and extraction history so data survives browser restarts.

- **Offscreen Document** (`src/extension/offscreen.html`)  
  A hidden document that handles clipboard writes without requiring focused tabs.

### Data Flow

1. User defines **profiles** (URL match patterns + named CSS selectors + output template).
2. When a matching page loads, the content script checks active profiles.
3. Extraction runs against the page DOM and returns structured outputs.
4. Output is formatted (plain text, Markdown, JSON, or custom template) and copied to the clipboard via the offscreen document.

---

## Features for Freelancers

Xelector helps freelancers accelerate **client acquisition**, **proposal workflows**, and **market research** by eliminating manual copy-paste work:

- **Client & Lead Extraction**  
  Scrape contact details, service listings, and project requirements from freelance platforms, directories, and client portals without leaving the browser.

- **Proposal Templating**  
  Combine extracted job data with personal proposal templates. Use `{{summary}}`, `{{url}}`, and custom selector variables to generate polished outreach messages in seconds.

- **Portfolio & Competitor Research**  
  Capture competitor headlines, pricing tables, and feature lists into structured Markdown or JSON for quick analysis and proposal benchmarking.

- **Profile Import / Export**  
  Migrate extraction setups between machines, share configurations with team members, or back up profiles as JSON files.

- **Automation-Friendly**  
  Profiles trigger automatically on matching domains and copy formatted output directly to the clipboard, reducing friction in repetitive research tasks.

---

## Installation

### From Source
1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the project root folder.
5. Pin the extension to your toolbar for quick access.

### Perissions Explained
- `activeTab` — Required to interact with the current tab when the user invokes the extension.
- `offscreen` — Enables the offscreen document for secure clipboard access.
- `scripting` — Allows extension scripts to run on web pages.
- `storage` — Persists profiles and extraction history locally.
- `host_permissions: <all_urls>` — Lets content scripts run on any site for extraction.

---

## Usage

### Creating a Profile
1. Click the Xelector icon and choose **Options** (or open the popup editor).
2. Click **New** to create a blank profile.
3. Enter a **URL match pattern** (e.g., `upwork.com/jobs/*`).
4. Add **selectors**: name, CSS selector, attribute to extract, and whether to match multiple elements.
5. Choose an **output format** (Text, Markdown, JSON) and optionally set a custom template.
6. Click **Save profile**.

### Running an Extraction
- **Automatic**: When visiting a matching URL, Xelector extracts and copies automatically (if enabled).
- **Manual**: Use the floating toolbar injected into the page, or run the extraction from the popup.

### Importing & Exporting Profiles
- **Export**: Click **Export** in the Profiles panel. A `xelector-profiles-YYYY-MM-DD.json` file downloads and the contents are copied to your clipboard.
- **Import**: Click **Import**, select a previously exported JSON file, and Xelector merges the profiles into your configuration.

---

## UI Screenshots

> Replace the placeholders below with actual screenshots of the extension UI for the Chrome Web Store listing.

### Popup / Options Page
![Popup / Options Page](docs/screenshots/popup-options.png)

### Floating Toolbar
![Floating Toolbar](docs/screenshots/floating-toolbar.png)

### Extracted Output
![Extracted Output](docs/screenshots/extracted-output.png)

---

## Development

### Prerequisites
- Node.js 18+
- Chrome 114+ (Manifest V3)

### Check Syntax
```bash
npm run check
```

### File Structure
```
.
├── manifest.json
├── package.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── src/
│   ├── extension/
│   │   ├── background.js
│   │   ├── content-script.js
│   │   ├── offscreen.html
│   │   └── offscreen.js
│   └── ui/
│       └── management/
│           ├── index.html
│           ├── styles.css
│           └── app.js
```

---

## License

MIT
