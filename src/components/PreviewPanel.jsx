import { useRef, useEffect, useState, useCallback } from 'react';
import { generateQRCanvas } from '../utils/qrCanvas.js';
import { getFilename, dataUrlToBlob } from '../utils/fileHelpers.js';
import { saveAs } from 'file-saver';

export default function PreviewPanel({
  settings,
  onSettingChange,
  onMarginAllChange,
  onResetDefaults,
  qrLines,
  labelEnabled,
  labelType,
  customLabelLines,
  filenameType,
  customFilenameLines,
}) {
  const canvasRef       = useRef(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showCanvas, setShowCanvas]     = useState(false);
  const [activeTab, setActiveTab]       = useState('basic');
  const [sizeLabel, setSizeLabel]       = useState('Size: 300 px  /  10.6 cm');
  const previewTimerRef = useRef(null);

  const clampedIndex = Math.max(0, Math.min(previewIndex, qrLines.length - 1));

  const getLabel = useCallback((url, index) => {
    if (!labelEnabled) return '';
    if (labelType === 'content') return url;
    return (customLabelLines[index] || '').trim();
  }, [labelEnabled, labelType, customLabelLines]);

  const renderPreview = useCallback(async (index, lines, s) => {
    if (lines.length === 0) {
      setShowCanvas(false);
      return;
    }
    const idx   = Math.max(0, Math.min(index, lines.length - 1));
    const url   = lines[idx];
    const label = getLabel(url, idx);

    try {
      const qrCanvas = await generateQRCanvas(url, label, s);
      const maxW = 260, maxH = 320;
      const scale = Math.min(maxW / qrCanvas.width, maxH / qrCanvas.height, 1);
      const w = Math.round(qrCanvas.width  * scale);
      const h = Math.round(qrCanvas.height * scale);

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(qrCanvas, 0, 0, w, h);

      setShowCanvas(true);
      const cm = (s.qrSize / 96 * 2.54).toFixed(1);
      setSizeLabel(`Size: ${s.qrSize} px  /  ${cm} cm`);
    } catch {
      // Preview errors (e.g. text too long) are non-fatal; keep the last good preview.
    }
  }, [getLabel]);

  // Debounced preview update
  useEffect(() => {
    clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      renderPreview(clampedIndex, qrLines, settings);
    }, 250);
    return () => clearTimeout(previewTimerRef.current);
  }, [settings, qrLines, clampedIndex, labelEnabled, labelType, customLabelLines, renderPreview]);

  // The index is clamped at render time (see clampedIndex), so no reset effect is needed.
  const handlePrev = () => {
    setPreviewIndex(() => Math.max(0, clampedIndex - 1));
  };
  const handleNext = () => {
    setPreviewIndex(() => Math.min(qrLines.length - 1, clampedIndex + 1));
  };

  const handleSaveOne = async () => {
    if (qrLines.length === 0) return;
    const url      = qrLines[clampedIndex];
    const label    = getLabel(url, clampedIndex);
    const filename = getFilename(url, clampedIndex, filenameType, customFilenameLines);
    try {
      const qrCanvas = await generateQRCanvas(url, label, settings);
      const dataUrl  = qrCanvas.toDataURL('image/png');
      saveAs(dataUrlToBlob(dataUrl), filename + '.png');
    } catch (e) {
      console.error('Save single QR failed:', e);
    }
  };

  const showNav = qrLines.length > 1;

  return (
    <div className="right-panel">
      <div className="card">

        <div className="panel-chrome">
          <span className="chrome-dot r"></span>
          <span className="chrome-dot y"></span>
          <span className="chrome-dot g"></span>
          <span className="preview-title">QR Preview</span>
        </div>

        <div className="preview-area">
          {showNav && (
            <div className="preview-nav">
              <button className="nav-btn" onClick={handlePrev}>&#8592;</button>
              <span className="nav-label">{clampedIndex + 1} / {qrLines.length}</span>
              <button className="nav-btn" onClick={handleNext}>&#8594;</button>
            </div>
          )}

          <div className="preview-canvas-box">
            {!showCanvas && (
              <div className="preview-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
                  <rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/>
                  <rect x="18" y="18" width="3" height="3"/>
                </svg>
                Enter a URL above<br />to see preview
              </div>
            )}
            <canvas
              ref={canvasRef}
              style={{ display: showCanvas ? 'block' : 'none' }}
            />
          </div>

          <div className="ruler"></div>
          <div className="size-label">{sizeLabel}</div>

          {showCanvas && (
            <button className="btn-save-one" onClick={handleSaveOne}>
              &#11015; Save this QR
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-btn${activeTab === 'basic' ? ' active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >Basic</button>
          <button
            className={`tab-btn${activeTab === 'show' ? ' active' : ''}`}
            onClick={() => setActiveTab('show')}
          >Style</button>
        </div>

        {/* BASIC Tab */}
        {activeTab === 'basic' && (
          <div>
            <div className="setting-row">
              <div className="setting-label">
                <span>Font Size</span>
                <span className="setting-val">{settings.fontSize}px</span>
              </div>
              <input type="range" min="8" max="72" value={settings.fontSize}
                onChange={e => onSettingChange('fontSize', +e.target.value)} />
            </div>

            <div className="setting-row">
              <div className="setting-label">
                <span>Label Gap <small style={{ color: '#94a3b8', fontWeight: 400 }}>(below QR)</small></span>
                <span className="setting-val">{settings.fontSpacing}px</span>
              </div>
              <input type="range" min="-50" max="50" value={settings.fontSpacing}
                onChange={e => onSettingChange('fontSpacing', +e.target.value)} />
            </div>

            <div className="setting-row">
              <div className="setting-label"><span>Font Family</span></div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select
                  style={{ flex: 1 }}
                  value={settings.fontFamily}
                  onChange={e => onSettingChange('fontFamily', e.target.value)}
                >
                  <option value="Arial">Arial</option>
                  <option value="'Times New Roman'">Times New Roman</option>
                  <option value="'Courier New'">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Impact">Impact</option>
                  <option value="Tahoma">Tahoma</option>
                  <option value="'Trebuchet MS'">Trebuchet MS</option>
                </select>
                <button
                  className={`font-style-btn${settings.fontWeight === 'bold' ? ' btn-active' : ''}`}
                  title="Bold"
                  onClick={() => {
                    const next = settings.fontWeight === 'bold' ? 'normal' : 'bold';
                    onSettingChange('fontWeight', next);
                  }}
                >B</button>
                <button
                  className={`font-style-btn${settings.fontStyle === 'italic' ? ' btn-active' : ''}`}
                  title="Italic"
                  style={{ fontStyle: 'italic', fontFamily: 'Georgia,serif' }}
                  onClick={() => {
                    const next = settings.fontStyle === 'italic' ? 'normal' : 'italic';
                    onSettingChange('fontStyle', next);
                  }}
                >I</button>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-label">
                <span>QR Code Size</span>
                <span className="setting-val">{settings.qrSize}px</span>
              </div>
              <input type="range" min="100" max="800" step="10" value={settings.qrSize}
                onChange={e => onSettingChange('qrSize', +e.target.value)} />
            </div>

            <div className="setting-row">
              <div className="setting-label">
                <span>Margin &mdash; All Sides</span>
                <span className="setting-val">{settings.marginAll}px</span>
              </div>
              <input type="range" min="0" max="120" step="2" value={settings.marginAll}
                onChange={e => onMarginAllChange(+e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
              {[
                ['marginTop',    'Top'],
                ['marginBottom', 'Bottom'],
                ['marginLeft',   'Left'],
                ['marginRight',  'Right'],
              ].map(([key, label]) => (
                <div className="setting-row" key={key} style={{ marginBottom: 0 }}>
                  <div className="setting-label">
                    <span>{label}</span>
                    <span className="setting-val">{settings[key]}px</span>
                  </div>
                  <input type="range" min="0" max="120" step="2" value={settings[key]}
                    onChange={e => onSettingChange(key, +e.target.value)} />
                </div>
              ))}
            </div>

            <div className="setting-row">
              <div className="setting-label"><span>Label Position</span></div>
              <select value={settings.dataDisplay} onChange={e => onSettingChange('dataDisplay', e.target.value)}>
                <option value="bottom">Below QR code</option>
                <option value="top">Above QR code</option>
                <option value="none">Hidden</option>
              </select>
            </div>

            <button className="btn-restore" onClick={onResetDefaults}>&#10006; Reset to defaults</button>
          </div>
        )}

        {/* STYLE Tab */}
        {activeTab === 'show' && (
          <div>
            <div className="setting-row">
              <div className="setting-label"><span>Label Color</span></div>
              <input type="color" value={settings.labelColor}
                onChange={e => onSettingChange('labelColor', e.target.value)} />
            </div>

            <div className="setting-row">
              <div className="setting-label"><span>Font Weight</span></div>
              <select value={settings.fontWeight} onChange={e => onSettingChange('fontWeight', e.target.value)}>
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="600">Semi-bold</option>
              </select>
            </div>

            <div className="setting-row">
              <div className="setting-label"><span>Font Style</span></div>
              <select value={settings.fontStyle} onChange={e => onSettingChange('fontStyle', e.target.value)}>
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
              </select>
            </div>

            <div className="setting-row">
              <div className="setting-label"><span>Background Color</span></div>
              <input type="color" value={settings.bgColor}
                onChange={e => onSettingChange('bgColor', e.target.value)} />
            </div>

            <div className="setting-row">
              <div className="setting-label"><span>QR Dark Color</span></div>
              <input type="color" value={settings.qrColorDark}
                onChange={e => onSettingChange('qrColorDark', e.target.value)} />
            </div>

            <div className="setting-row">
              <div className="setting-label"><span>QR Light Color</span></div>
              <input type="color" value={settings.qrColorLight}
                onChange={e => onSettingChange('qrColorLight', e.target.value)} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
