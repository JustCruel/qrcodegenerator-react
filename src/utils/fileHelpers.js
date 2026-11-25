import { LIMITS } from './constants.js';

/**
 * Derive a filename for a QR code entry.
 * @param {string} url - The QR content
 * @param {number} index - Zero-based index
 * @param {string} filenameType - 'number' | 'content' | 'custom'
 * @param {string[]} customFilenameLines - Lines from the custom filename textarea
 */
export function getFilename(url, index, filenameType, customFilenameLines) {
  const fallback = `qrcode_${String(index + 1).padStart(4, '0')}`;

  if (filenameType === 'number') return fallback;

  if (filenameType === 'content') {
    return url.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').substring(0, 60) || fallback;
  }

  // custom: letters/digits of any language only. Blocks path separators, dots,
  // control and bidi-override characters that could spoof names inside the ZIP.
  const custom = (customFilenameLines[index] || '')
    .trim()
    .replace(/[^\p{L}\p{N}_-]/gu, '_')
    .substring(0, LIMITS.maxFilenameLength);
  return custom || fallback;
}

/**
 * Convert a data URL to a Blob.
 */
export function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mime  = parts[0].match(/:(.*?);/)[1];
  const bstr  = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

/**
 * Parse the first column of a CSV (handles quoted fields with embedded newlines).
 */
export function parseFirstColumnCSV(text) {
  const results = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    while (i < len && (text[i] === '\r' || text[i] === '\n')) i++;
    if (i >= len) break;

    let field = '';
    if (text[i] === '"') {
      i++;
      while (i < len) {
        if (text[i] === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; }
          else { i++; break; }
        } else {
          field += text[i++];
        }
      }
      field = field.replace(/\r\n|\r|\n/g, '');
    } else {
      while (i < len && text[i] !== ',' && text[i] !== '\r' && text[i] !== '\n') {
        field += text[i++];
      }
    }

    while (i < len && text[i] !== '\r' && text[i] !== '\n') i++;

    field = field.trim();
    if (field) results.push(field);
  }

  const merged = [];
  for (const line of results) {
    const prev = merged.length > 0 ? merged[merged.length - 1] : null;
    if (
      prev &&
      /^https?:\/\//i.test(prev) &&
      !/^https?:\/\//i.test(line) &&
      !/\s/.test(line)
    ) {
      merged[merged.length - 1] = prev + line;
    } else {
      merged.push(line);
    }
  }
  return merged;
}
