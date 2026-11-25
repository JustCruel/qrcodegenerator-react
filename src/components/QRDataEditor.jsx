import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import LineNumbers from './LineNumbers.jsx';
import { LIMITS, ALLOWED_IMPORT_EXTENSIONS } from '../utils/constants.js';

const DEMO_QR_DATA = [
  'https://example.com',
  'https://google.com',
  'https://github.com',
  'CONTACT: John Doe | +1 555-0100',
  'WIFI:T:WPA;S:MyNetwork;P:password123;;',
].join('\n');
const DEMO_FILENAMES = 'example\ngoogle\ngithub\njohn-contact\nwifi-info';
const DEMO_LABELS    = 'example.com\ngoogle.com\ngithub.com\nJohn Doe\nWi-Fi Info';

const URL_PREFIX = /^https?:\/\//i;

const cleanCell = (val) => String(val ?? '').replace(/\r\n|\r|\n/g, '').trim();

/** Validate the picked file before it is parsed. Returns an error message or ''. */
function validateImportFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_IMPORT_EXTENSIONS.includes(ext)) {
    return `Unsupported file type. Use: ${ALLOWED_IMPORT_EXTENSIONS.join(', ')}.`;
  }
  if (file.size > LIMITS.maxImportBytes) {
    return `File is too large (max ${LIMITS.maxImportBytes / 1024 / 1024} MB).`;
  }
  return '';
}

/** Rejoin URLs that were split across rows by a stray line break. */
function mergeBrokenUrls(rows) {
  const merged = [];
  for (const row of rows) {
    const val  = cleanCell(row[0]);
    const prev = merged.length > 0 ? merged[merged.length - 1] : null;
    const prevVal = prev ? cleanCell(prev[0]) : '';
    if (prev && val && URL_PREFIX.test(prevVal) && !URL_PREFIX.test(val) && !/\s/.test(val)) {
      merged[merged.length - 1] = [prevVal + val, ...prev.slice(1)];
    } else {
      merged.push(row);
    }
  }
  return merged;
}

function parseWorkbook(buffer) {
  const wb   = XLSX.read(new Uint8Array(buffer), { type: 'array', raw: false });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

  const hasHeader = rows.length > 0 && /^(url|link|address|text|data)$/i.test(cleanCell(rows[0][0]));
  const dataRows  = mergeBrokenUrls(hasHeader ? rows.slice(1) : rows).slice(0, LIMITS.maxEntries);

  return {
    urls:      dataRows.map((r) => cleanCell(r[0]).slice(0, LIMITS.maxTextLength)).filter(Boolean),
    filenames: dataRows.map((r) => cleanCell(r[1]).slice(0, LIMITS.maxFilenameLength)),
    labels:    dataRows.map((r) => cleanCell(r[2]).slice(0, LIMITS.maxLabelLength)),
  };
}

export default function QRDataEditor({ value, onChange, onImport, qrCount }) {
  const textareaRef  = useRef(null);
  const lineNumsRef  = useRef(null);
  const fileInputRef = useRef(null);
  const [importError, setImportError] = useState('');

  const handleScroll = () => {
    if (lineNumsRef.current && textareaRef.current) {
      lineNumsRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleDemo = () => {
    setImportError('');
    onChange({ qrData: DEMO_QR_DATA, demoFilenames: DEMO_FILENAMES, demoLabels: DEMO_LABELS });
  };

  const handleImportFile = (e) => {
    const input = e.target;
    const file  = input.files[0];
    input.value = '';
    if (!file) return;

    const error = validateImportFile(file);
    if (error) {
      setImportError(error);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        onImport(parseWorkbook(ev.target.result));
        setImportError('');
      } catch {
        setImportError('Could not read this file. Make sure it is a valid .txt, .csv or .xlsx.');
      }
    };
    reader.onerror = () => setImportError('Could not read this file.');
    reader.readAsArrayBuffer(file);
  };

  const handleChange = (e) => {
    onChange({ qrData: e.target.value });
  };

  return (
    <div className="card">
      <div className="section-title">
        <span className="section-icon icon-emerald">&#128279;</span>
        QR Code Data
        <i className="help-icon" title="Enter one URL or text per line. Each line becomes one QR code.">?</i>
        <span className="count-badge">{qrCount}</span>
      </div>
      <div className="section-desc">
        One entry per line &mdash; each becomes a separate QR code. QR codes are permanently valid.
      </div>
      <div className="toolbar-row">
        <button className="btn btn-green" onClick={handleDemo}>&#10003; Load Demo</button>
        <button
          className="btn btn-teal"
          onClick={() => fileInputRef.current?.click()}
          title="Import from .txt, .csv, or .xlsx"
        >
          &#128196; Import File
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept=".txt,.csv,.xlsx,.xls"
          className="hidden-input"
          onChange={handleImportFile}
        />
        <span className="toolbar-spacer"></span>
      </div>
      {importError && <div className="mismatch-warn" role="alert">&#9888; {importError}</div>}
      <div className="editor-wrapper">
        <LineNumbers value={value} gutterRef={lineNumsRef} />
        <textarea
          className="editor-textarea"
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onScroll={handleScroll}
          placeholder={"https://example.com\nhttps://your-second-link.com\nAny text here too"}
          spellCheck={false}
          maxLength={LIMITS.maxEntries * LIMITS.maxTextLength}
        />
      </div>
      <div className="align-right">
        <button className="btn btn-red" onClick={() => onChange({ qrData: '' })}>
          &#128465; Clear
        </button>
      </div>
    </div>
  );
}
