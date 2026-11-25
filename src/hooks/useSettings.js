import { useState, useCallback } from 'react';
import { FONT_FAMILIES, FONT_WEIGHTS, FONT_STYLES, DATA_DISPLAYS } from '../utils/constants.js';

const STORAGE_KEY = 'qrgen_settings';

const DEFAULTS = Object.freeze({
  fontSize:     16,
  fontSpacing:  10,
  fontFamily:   'Arial',
  qrSize:       300,
  dataDisplay:  'bottom',
  labelColor:   '#000000',
  fontWeight:   'normal',
  fontStyle:    'normal',
  bgColor:      '#ffffff',
  qrColorDark:  '#000000',
  qrColorLight: '#ffffff',
  marginAll:    0,
  marginTop:    0,
  marginRight:  0,
  marginBottom: 0,
  marginLeft:   0,
});

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const clampNumber = (min, max) => (v) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : undefined;
const oneOf   = (allowed) => (v) => (allowed.includes(v) ? v : undefined);
const hexOnly = (v) => (typeof v === 'string' && HEX_COLOR.test(v) ? v : undefined);

/** Every setting is checked against an allow-list or range before it is used. */
const VALIDATORS = {
  fontSize:     clampNumber(8, 72),
  fontSpacing:  clampNumber(-50, 50),
  fontFamily:   oneOf(FONT_FAMILIES),
  qrSize:       clampNumber(100, 800),
  dataDisplay:  oneOf(DATA_DISPLAYS),
  labelColor:   hexOnly,
  fontWeight:   oneOf(FONT_WEIGHTS),
  fontStyle:    oneOf(FONT_STYLES),
  bgColor:      hexOnly,
  qrColorDark:  hexOnly,
  qrColorLight: hexOnly,
  marginAll:    clampNumber(0, 120),
  marginTop:    clampNumber(0, 120),
  marginRight:  clampNumber(0, 120),
  marginBottom: clampNumber(0, 120),
  marginLeft:   clampNumber(0, 120),
};

/** Returns a safe copy of `candidate`, falling back to defaults for invalid values. */
export function sanitizeSettings(candidate) {
  const source = candidate && typeof candidate === 'object' ? candidate : {};
  const safe = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS)) {
    const valid = VALIDATORS[key](source[key]);
    if (valid !== undefined) safe[key] = valid;
  }
  return safe;
}

function persist(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage may be unavailable (private mode / quota); settings stay in memory.
  }
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? sanitizeSettings(JSON.parse(saved)) : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(loadFromStorage);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const next = sanitizeSettings({ ...prev, [key]: value });
      persist(next);
      return next;
    });
  }, []);

  const updateMarginAll = useCallback((value) => {
    setSettings((prev) => {
      const next = sanitizeSettings({
        ...prev,
        marginAll:    value,
        marginTop:    value,
        marginRight:  value,
        marginBottom: value,
        marginLeft:   value,
      });
      persist(next);
      return next;
    });
  }, []);

  const resetDefaults = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clear if storage is unavailable.
    }
    setSettings({ ...DEFAULTS });
  }, []);

  return { settings, updateSetting, updateMarginAll, resetDefaults, DEFAULTS };
}
