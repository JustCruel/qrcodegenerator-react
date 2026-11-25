# QR Batch Generator

A browser-based tool that turns a list of links or text lines into many QR code images at once. Add an optional caption to each code, choose how files are named, and download everything as one ZIP of PNG images (`qrcodes.zip`).

No login, no backend, no database. Generation happens in the browser, and the only network request is loading the Inter font from Google Fonts.

## Features

- One QR code per line, with a line counter, demo data and clear button
- Import `.txt`, `.csv`, `.xlsx` or `.xls` (column 1 = data, column 2 = filename, column 3 = label)
- Filename rules: number, content, or custom (duplicates get `_2`, `_3`, ...)
- Optional text label: QR content or custom, placed below or above the code
- Live preview with previous/next navigation and a "Save this QR" button
- Style settings: QR size, colours, margins, label font, size, weight and spacing (saved in the browser, resettable)
- Automatic verification: each finished image is decoded again and must match the input
- Result gallery with Verified/Mismatch badges, single-image save and ZIP re-download

## Tech stack

React 19, Vite 8, plain CSS. Libraries: `qrcode` (drawing), `jsqr` (verification), `jszip` and `file-saver` (ZIP download), `xlsx` (import). Linting with ESLint 10.

## Getting started

```bash
npm install
npm run dev       # development server
npm run build     # build static files into dist/
npm run preview   # serve the build locally
npm run lint      # run ESLint
```

The build output in `dist/` is plain static files and can be served by any static web server. The production hosting setup is not documented in this repository.

## Project structure

```
index.html              page shell, loads the Inter font
src/
  main.jsx              mounts <App/>
  App.jsx               shared state, wires the components together
  components/           BottomBar, FilenameEditor, Header, LabelEditor,
                        PreviewPanel, QRDataEditor, ResultModal
  hooks/
    useQRGenerator.js   batch loop, verification, ZIP, progress
    useSettings.js      style settings and localStorage
  utils/
    qrCanvas.js         draw and verify one QR code
    fileHelpers.js      filename rules and helpers
docs/
  PROJECT_OVERVIEW.md   full overview: architecture, workflows, rules, coverage
```

## Good to know

- Everything is in memory and lost on reload, except the style settings (`localStorage` key `qrgen_settings`).
- If an image fails to render it is skipped and only logged to the browser console.
- A "Mismatch" badge usually means low contrast, a very small QR size, or margins and labels interfering. Increase size and contrast.
- There is no user access control in the app.

## Documentation

See [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) for the architecture, diagrams, workflows, business rules, deployment notes, troubleshooting and open items.
