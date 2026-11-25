# QR Batch Generator - Project Overview

Folder: `qrcodegenerator-react` | Document type: high-level overview | Basis: source code only (no tests or app run)

Items that could not be verified from the source are marked **Requires confirmation**.
Paths are relative to `qrcodegenerator-react/` unless stated.

---

## 1. Executive summary

**What it is.** A web tool that turns a list of links or text lines into many QR code images at once. The user can add a caption under each code and choose how files are named. The result is one ZIP of PNG images (`qrcodes.zip`).

**Who uses it.** Anyone who needs QR codes in bulk (marketing, labels, asset tags, event material). There is no login and no sign-up.

**Key benefits**
- Bulk: one QR code per line, or import a spreadsheet or text file.
- Control: size, colours, margins, caption font and position.
- Quality check: each image is decoded again after drawing, and the result must match the input.
- Privacy: generation happens in the browser. The source makes no network calls except loading the Inter font from Google Fonts (`index.html`). No data is sent to a server (verified by searching `src/`; there is no `fetch`, XHR or backend).

**Technical summary.** A single-page React 19 app built with Vite 8. There is no backend, no database, no login and no router. The only storage is the browser's `localStorage`, which keeps the style settings.

**Existing documentation.** `README.md` is the unmodified Vite template and has no project content. This document is the first project documentation. There is no CLAUDE.md or CONTRIBUTING file, so no project-specific documentation rules apply.

---

## 2. Status

| Feature | Status | Evidence |
|---|---|---|
| Enter QR data (one per line), line counter, demo data, clear | Implemented | `src/components/QRDataEditor.jsx` |
| Import `.txt`, `.csv`, `.xlsx`, `.xls` (col 1 data, col 2 filename, col 3 label) | Implemented | `QRDataEditor.jsx` |
| Filename rules: number, content, custom, with duplicate handling | Implemented | `src/utils/fileHelpers.js`, `src/hooks/useQRGenerator.js` |
| Label rules: on/off, QR content, custom, line-break helpers | Implemented | `src/components/LabelEditor.jsx` |
| Live preview with previous/next, size in px and cm | Implemented | `src/components/PreviewPanel.jsx` |
| Style settings, saved in the browser, reset to defaults | Implemented | `PreviewPanel.jsx`, `src/hooks/useSettings.js` |
| Batch generation, verification, ZIP download | Implemented | `src/hooks/useQRGenerator.js`, `src/utils/qrCanvas.js` |
| Result gallery with verified/mismatch badges, per-image save, re-download | Implemented | `src/components/ResultModal.jsx` |
| Save a single QR from the preview | Implemented | `PreviewPanel.jsx` (`handleSaveOne`) |
| Reporting of images that failed to render | **Partial.** Failures are skipped and only written to the browser console (`console.warn`). The status line still reports the total input count, which can be higher than the images produced. | `useQRGenerator.js` |
| Reporting of an unreadable import file | **Partial.** The import code has no error handling for a corrupt file. | `QRDataEditor.jsx` |
| Server features (accounts, history, API, analytics) | No implemented code. No plan is documented. | none found |
| Planned / on-hold work | None documented. **Requires confirmation** with the owner. | none found |

Minor code leftovers: `saveSettings` is exported by `useSettings.js` but not used anywhere in `src/`. The dependency `xlsx@0.18.5` is an old npm release. Check it against current security advisories before any public deployment (**Requires confirmation**).

---

## 3. Architecture and system context

### 3.1 System context

```
                  +-------------------------------+
   User --------> |  Web browser (user's device)  |
  (anyone)        |                               |
                  |   QR Batch Generator (SPA)    |
                  |   React 19 + Vite build       |
                  +---+-----------+-----------+---+
                      |           |           |
          DIRECT      |           |           |
          (browser    v           v           v
           APIs)   localStorage  FileReader  Blob download
                   "qrgen_       (import     (file-saver ->
                    settings"     files)      qrcodes.zip / .png)

          INDIRECT (not called by app logic)
          +---------------------+      +-----------------------------+
          | Google Fonts CDN    |      | Web server hosting dist/    |
          | (Inter font, loaded |      | (probably IIS; not verified)|
          |  by index.html)     |      | serves static files only    |
          +---------------------+      +-----------------------------+
```

Direct integrations are browser features used by the code. Indirect ones are services the page depends on but the code does not call. Nothing is sent from the user's data to any server.

### 3.2 Technology stack

| Layer | Technology | Evidence |
|---|---|---|
| UI | React 19.2, plain CSS (`App.css`, `index.css`) | `package.json`, `src/` |
| Build and dev | Vite 8 with `@vitejs/plugin-react` | `vite.config.js` |
| QR drawing | `qrcode` library (error correction level H) | `src/utils/qrCanvas.js` |
| QR verification | `jsqr` library | `src/utils/qrCanvas.js` |
| ZIP and download | `jszip`, `file-saver` | `src/hooks/useQRGenerator.js` |
| Spreadsheet import | `xlsx` (SheetJS) | `QRDataEditor.jsx` |
| Quality | ESLint 10 (`npm run lint`) | `eslint.config.js` |
| Backend / database | None | no server code in the folder |

### 3.3 Code layout

```
qrcodegenerator-react/
+-- index.html            page shell, loads Inter font, mounts /src/main.jsx
+-- vite.config.js        React plugin only
+-- package.json          scripts: dev, build, lint, preview
+-- public/               favicon.svg, icons.svg
+-- dist/                 built output (Nov 9 build present; git-ignored)
+-- src/
    +-- main.jsx          mounts <App/>
    +-- App.jsx           ALL shared state; wires components together
    +-- components/       7 UI parts (see section 6)
    +-- hooks/
    |   +-- useQRGenerator.js   batch loop, verify, ZIP, progress
    |   +-- useSettings.js      style settings + localStorage
    +-- utils/
        +-- qrCanvas.js         draw one QR (+label+margins) / verify it
        +-- fileHelpers.js      filename rules, data-URL to Blob, CSV parser
```

---

## 4. Roles and access matrix

There are no user roles, accounts or permissions in the source.

| Role | Access |
|---|---|
| Any visitor | Full access to every feature |

Access control, if any, would come from the hosting environment (for example IIS or network rules). **Requires confirmation**.

---

## 5. Navigation

The app is one screen. Nothing changes the URL. The only overlay is the result window.

```
+------------------------------------------------------------------+
| HEADER  "QR Batch Generator"                                     |
+---------------------------------+--------------------------------+
| LEFT PANEL                      | RIGHT PANEL                    |
|  [QR Code Data]                 |  [QR Preview]  <- 1 / N ->     |
|     Load Demo | Import | Clear  |     Save this QR               |
|  [Custom File Name]             |  Tabs: [Basic] [Style]         |
|     Number | Content | Custom   |   Basic: font size, spacing,   |
|  [Text Label]                   |     font, bold/italic, QR size,|
|     ON/OFF, Content | Custom    |     margins                    |
|                                 |   Style: label position/colour,|
|                                 |     weight, style, colours     |
+---------------------------------+--------------------------------+
| BOTTOM BAR  [Generate & Download ZIP]  progress bar  status text|
+------------------------------------------------------------------+
                         |
                         v  (after generation)
              +--------------------------+
              | RESULT MODAL             |
              |  grid of generated QRs   |
              |  Download ZIP | Save | X |
              +--------------------------+
```

---

## 6. Modules and how they interact

### 6.1 Module summary

| Module | File | Responsibility |
|---|---|---|
| App | `src/App.jsx` | Holds data, filename, label state. Computes line lists, counts and mismatch flags. Passes everything down. |
| Header | `components/Header.jsx` | Title and tagline. |
| QRDataEditor | `components/QRDataEditor.jsx` | Text box with line numbers, demo data, file import, clear. |
| FilenameEditor | `components/FilenameEditor.jsx` | Filename mode (Number / Content / Custom) and custom list. |
| LabelEditor | `components/LabelEditor.jsx` | Caption on/off, mode, custom list, line-break and "Extract content" helpers. |
| PreviewPanel | `components/PreviewPanel.jsx` | Debounced (250 ms) live preview, navigation, single save, Basic and Style settings, reset. |
| BottomBar | `components/BottomBar.jsx` | Generate button, progress bar, status message. |
| ResultModal | `components/ResultModal.jsx` | Gallery of results, verification badges, per-image save, re-download. |
| useSettings | `hooks/useSettings.js` | 17 style settings with defaults, saved to `localStorage`. |
| useQRGenerator | `hooks/useQRGenerator.js` | Runs the batch and produces the ZIP. |
| qrCanvas | `utils/qrCanvas.js` | `generateQRCanvas` and `verifyQRCanvas`. |
| fileHelpers | `utils/fileHelpers.js` | `getFilename`, `dataUrlToBlob`, `parseFirstColumnCSV`. |

`parseFirstColumnCSV` is defined in `fileHelpers.js`, but `QRDataEditor.jsx` imports files through SheetJS instead. The function appears unused (**Requires confirmation**).

### 6.2 Interaction diagram

```
          +------------------------- App.jsx (state owner) -------------------------+
          | qrData  filenameType/customFilenames  labelEnabled/Type/customLabels   |
          +--+----------+-----------+-------------+-------------+------------------+
             |          |           |             |             |
             v          v           v             v             v
      QRDataEditor FilenameEditor LabelEditor PreviewPanel  BottomBar / ResultModal
        (import,     (mode+list)   (mode+list)   |  ^            ^
         demo)                                   |  |            |
             |                                   |  | settings   | progress,
             +--- onImport / onChange -> App     |  +--useSettings results
                                                 |  (localStorage)
                                                 v                |
                                          qrCanvas.generateQRCanvas|
                                                 ^                |
                                                 |          useQRGenerator
                                                 +-------- (loop, verify, ZIP)
                                                                  |
                                                          fileHelpers.getFilename
```

---

## 7. Pages

There is no router. The "pages" are the single screen and one modal.

| UI surface | Route / entry | Access | Purpose | Key rules | Storage used | Status |
|---|---|---|---|---|---|---|
| Main screen (`App`) | `/` (`index.html` -> `main.jsx`) | Everyone | Enter data, set options, preview, generate | Blank lines are ignored. One QR per non-empty line. Custom filename and label counts are compared with the QR count and a warning appears on mismatch. | `localStorage` key `qrgen_settings` (style settings only) | Implemented |
| Result modal (`ResultModal`) | Opens after a successful batch | Everyone | Review results, save single images, download ZIP again | Shows a Verified or Mismatch badge per image. Clicking the overlay closes it. | In-memory results only | Implemented |

Static pages `privacy-policy.html` and `terms.html` exist in the older sibling folder `../qrcodegenerator/`. They are not part of this app. **Requires confirmation** whether the deployed site links to them.

---

## 8. Key workflows

### 8.1 Generate a batch (main workflow)

```
User enters/imports lines
        |
        v
Choose filename rule + label rule + style settings (live preview updates)
        |
        v
Click "Generate & Download ZIP"
        |
        +-- no non-empty line? --> alert "Please enter at least one URL..." --> stop
        v
For each line i (progress 0-90%):
   label    = off ? "" : (content ? line : custom[i])
   filename = rule(number|content|custom); duplicates get _2, _3 ...
   draw QR (+margins, +label)  --error--> skip image, console.warn, continue
   decode with jsQR, compare with line  -> verified true/false
   add PNG to ZIP
        |
        v
Pack ZIP (95-100%) -> download qrcodes.zip -> open Result modal
   status: "Done! N QR codes downloaded - X verified [ - Y failed ]"
```

### 8.2 Import a file
1. Click Import File and choose `.txt`, `.csv`, `.xlsx` or `.xls`.
2. The first sheet is read. A first row whose first cell is `url`, `link`, `address`, `text` or `data` is treated as a header and skipped.
3. Column 1 becomes the QR data, column 2 the filenames, column 3 the labels. Filenames and labels are applied only if at least one value exists, and the mode is switched to Custom.
4. A row that looks like a continuation of a broken URL (no `http(s)://`, no spaces, following an `http(s)://` row) is joined onto the previous row.
5. Errors: reading a corrupt file is not handled (see section 2).

### 8.3 Settings
Each change is saved to `localStorage` at once. "Reset" clears the saved key and restores defaults. If `localStorage` is blocked, saving fails silently and the app works with defaults for that session.

### 8.4 Error handling summary

| Situation | Behaviour |
|---|---|
| No input lines | Browser alert, no generation |
| Custom filename/label count differs from QR count | Amber warning; generation still allowed. Missing custom filename falls back to `qrcode_0001` style names, missing label gives no label |
| Duplicate filenames | Suffix `_2`, `_3` ... |
| One image fails to render | Skipped, logged to console only |
| Decoded text differs from input | Image still included in ZIP and marked "Mismatch" |
| ZIP or unexpected error | Status line shows `Error: <message>` |
| Preview render error | Ignored silently |
| `localStorage` unavailable | Ignored silently |

---

## 9. Data and integrations

### 9.1 Data
There is no database. All data is in memory and disappears on page reload, except the style settings.

```
 qrData (text)  --split by line, drop blank-->  qrLines[ ]   (1 per QR)
 customFilenames (text) --split by line-->      filename[i]  (matched by index)
 customLabels    (text) --split by line-->      label[i]     (matched by index)
 settings (17 values) ------------------------> applied to every QR
        |
        v
 results[ ] = { url, label, filename, dataUrl, verified, decoded }   (in memory)
        |
        v
 qrcodes.zip containing <filename>.png ...
```

Records are tied together only by line position (index), not by keys.

### 9.2 Stored settings (`localStorage` key `qrgen_settings`)

Defaults from `src/hooks/useSettings.js`. Slider ranges are from `PreviewPanel.jsx`.

| Setting | Default | Notes |
|---|---|---|
| fontSize | 16 | Range 8-72 px |
| fontSpacing | 10 | Range -50 to 50 px (gap between QR and label) |
| fontFamily | Arial | 8 fonts offered |
| fontWeight / fontStyle | normal / normal | Bold, semi-bold, italic options |
| qrSize | 300 | Range 100-800 px; the screen also shows the cm size at 96 dpi |
| dataDisplay | bottom | Label below, above, or hidden |
| labelColor / bgColor | #000000 / #ffffff | Label text and image background |
| qrColorDark / qrColorLight | #000000 / #ffffff | QR modules and QR background |
| marginAll, marginTop/Right/Bottom/Left | 0 | Range 0-120 px |

### 9.3 Integrations

| Integration | Type | Status |
|---|---|---|
| Google Fonts (Inter) | CDN stylesheet in `index.html` | Live, runtime. If blocked, the browser falls back to another font |
| `localStorage` | Browser storage | Live |
| File import (FileReader + SheetJS) | Local file | Live, manual |
| ZIP / PNG download (file-saver) | Browser download | Live, manual |
| Email, APIs, queues, schedulers | none | Not present |

---

## 10. Business rules and state transitions

**Filename rules** (`fileHelpers.getFilename`)
- Number: `qrcode_0001`, `qrcode_0002`, and so on (4 digits).
- Content: the QR text with every character other than letters, digits, `_` and `-` replaced by `_`, repeats collapsed, cut to 60 characters. Falls back to `qrcode_<n>` if empty.
- Custom: the entry on the same line, with unsafe characters replaced by `_`. Falls back to `qrcode_0001` style if empty.
- Duplicates in one batch receive `_2`, `_3`, and so on.

**Label rules**
- Label OFF: no text at all.
- QR content: the label is the QR text. Custom: the entry on the same line.
- Text wider than the image minus 10 px is shortened with an ellipsis.
- If the label position is "Hidden", no label is drawn on the image (the result gallery may still list the label text).

**Image rules** (`qrCanvas.generateQRCanvas`)
- Total width is left margin + QR size + right margin. Height adds the label height and top and bottom margins.
- The QR uses the highest error-correction level (H).
- Empty text is rejected.

**Verification rule.** The final image (including margins and label) is decoded with jsQR. It is "verified" only if the decoded text equals the input after trimming. Very low contrast, very small sizes or large margins could cause a "Mismatch"; this is an expectation, not tested (**Requires confirmation**).

**Generation state transitions**

```
 idle --click Generate--> running (button disabled, progress 0-100%)
 running --success--> done (status message 4 s, modal open)
 running --exception--> error (status shows "Error: ...")
 modal open --close or overlay click--> idle
 modal open --Download ZIP--> modal closes, generation runs again
```

---

## 11. Deployment and troubleshooting

**Commands** (`package.json`): `npm run dev` (development server), `npm run build` (writes `dist/`), `npm run preview` (serve the build locally), `npm run lint`.

**Deployment.** The build is plain static files in `dist/`. The folder lives under `c:\inetpub\wwwroot`, which suggests IIS static hosting, but there is no `web.config`, deploy script or URL in the source. The hosting method, URL and the relation to the older `../qrcodegenerator/` site are **Requires confirmation**.

**Note.** `index.html` references `/favicon.svg` with an absolute path. If the site is hosted in a sub-folder, the base path in Vite may need configuring (**Requires confirmation**).

**Troubleshooting**

| Symptom | Likely cause / action |
|---|---|
| Blank page after deploy | Static files not served from the site root or wrong base path |
| Different font | Google Fonts blocked or offline |
| "Mismatch" badge | Low contrast colours, tiny QR size, or label/margins interfering. Increase size and contrast |
| Fewer images than expected | Some lines failed to render and were skipped; open the browser console |
| Settings not remembered | Private browsing or storage blocked; settings are lost on reload |
| Slow with very large batches | Rendering is sequential in the browser. A size limit is not defined in the source (**Requires confirmation**) |
| Wrong file names | Custom list shorter than the QR list, or unsupported characters replaced by `_` |

---

## 12. Glossary

| Term | Meaning |
|---|---|
| QR code | A square barcode that stores text or a link |
| Batch | All lines processed in one click |
| Label | Caption printed on the image next to the QR code |
| Margin | Empty space added around the QR image |
| Error correction H | QR setting that tolerates the most damage; produces denser codes |
| Verification | Re-reading the finished image to confirm it decodes to the original text |
| SPA | Single-page application: one page, no page reloads |
| Vite | Build tool that produces the static `dist/` files |
| `localStorage` | Small storage area in the user's browser |
| ZIP | One compressed file containing all PNG images |

---

## 13. Coverage

Counted from `src/App.jsx` and `src/components/`. This project has no routes, so the inventory is the UI surfaces and components.

### 13.1 Page / surface inventory

| Class | Count | Items |
|---|---|---|
| Implemented | 2 | Main screen, Result modal |
| Partially implemented | 0 | none |
| No implemented route | 0 | none |
| **Total** | **2** | |

Flag: "Requires confirmation" applies to deployment (URL, hosting) rather than to any surface.

### 13.2 Component inventory (7 of 7 documented)

BottomBar, FilenameEditor, Header, LabelEditor, PreviewPanel, QRDataEditor, ResultModal. All are mounted from `App.jsx`: 7 mounted, 0 unmounted.

### 13.3 Feature-level partial items (from section 2)

2 partial: failure reporting during generation, import error handling. They belong to the Implemented surfaces above and are not counted as separate pages.

### 13.4 Specified but not built

None found. No spec, backlog or screen-spec files exist in the folder.

### 13.5 Coverage rules applied
- A route does not prove a page works. There is no router, so each surface was checked in the component code.
- A view does not prove access. No access control exists in the source.
- A menu entry does not prove authorization. There is no menu.
- API and export endpoints are auxiliary routes. There are none. The ZIP and PNG downloads are browser-generated.
- "No sidebar entry" is not "inaccessible". There is no sidebar. The modal is reachable only after generation.
- Duplicates are judged on method + URI. There are no URIs to compare.
- Older audits are not facts until re-verified. No earlier audit exists. The sibling `../qrcodegenerator/` folder was only glanced at: its `index.html` loads libraries from CDNs and has a similar title and layout, but it was not analysed in depth.

### 13.6 Open items
1. Production URL, hosting method and Vite base path.
2. Relationship to `../qrcodegenerator/` (older version?) and whether it is to be retired.
3. Whether privacy and terms pages should be linked from this app.
4. Owner and support contact.
5. Batch size limits.
6. Dependency review (`xlsx`) and removal of unused code (`saveSettings`, `parseFirstColumnCSV`).
