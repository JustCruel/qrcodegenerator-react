/** Upper bounds that protect the browser from oversized or malicious input. */
export const LIMITS = Object.freeze({
  maxImportBytes:    5 * 1024 * 1024, // 5 MB import file
  maxEntries:        2000,            // QR codes per batch
  maxTextLength:     1000,            // chars per QR entry (level H capacity is ~1273 bytes)
  maxLabelLength:    200,
  maxFilenameLength: 100,
});

export const ALLOWED_IMPORT_EXTENSIONS = Object.freeze(['txt', 'csv', 'xlsx', 'xls']);

export const FONT_FAMILIES = Object.freeze([
  'Arial',
  "'Times New Roman'",
  "'Courier New'",
  'Georgia',
  'Verdana',
  'Impact',
  'Tahoma',
  "'Trebuchet MS'",
]);

export const FONT_WEIGHTS  = Object.freeze(['normal', 'bold', '600']);
export const FONT_STYLES   = Object.freeze(['normal', 'italic']);
export const DATA_DISPLAYS = Object.freeze(['bottom', 'top', 'none']);
