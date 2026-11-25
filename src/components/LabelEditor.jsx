import { useRef } from 'react';
import LineNumbers from './LineNumbers.jsx';
import { LIMITS } from '../utils/constants.js';

export default function LabelEditor({
  labelEnabled,
  onLabelEnabledChange,
  labelType,
  onLabelTypeChange,
  customLabels,
  onCustomLabelsChange,
  qrData,
  qrCount,
  labelCount,
  mismatch,
}) {
  const textareaRef = useRef(null);
  const lineNumsRef = useRef(null);

  const handleScroll = () => {
    if (lineNumsRef.current && textareaRef.current) {
      lineNumsRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleAddLineBreak = () => {
    if (!textareaRef.current) return;
    const ta  = textareaRef.current;
    const pos = ta.selectionStart;
    const next = customLabels.slice(0, pos) + '\n' + customLabels.slice(pos);
    onCustomLabelsChange(next);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = pos + 1;
    });
  };

  const handleRemoveLineBreak = () => {
    onCustomLabelsChange(customLabels.replace(/\n/g, ' '));
  };

  const handleExtractContent = () => {
    onCustomLabelsChange(qrData);
  };

  const labelTypes = [
    { value: 'content', label: '🔗 QR content' },
    { value: 'custom',  label: '✎ Custom' },
  ];

  return (
    <div className="card">
      <div className="section-title">
        <span className="section-icon icon-amber">&#127991;</span>
        Text Label
        <i className="help-icon" title="Add a text label printed below (or above) each QR code image">?</i>
        <span className={`count-badge${mismatch ? ' count-badge-warn' : ''}`}>
          {labelEnabled && labelType === 'custom' ? labelCount : 0}
        </span>
      </div>
      <div className="section-desc">Optionally print a caption on each QR code image.</div>

      <div className="toggle-row">
        <label className="toggle">
          <input
            type="checkbox"
            checked={labelEnabled}
            onChange={e => onLabelEnabledChange(e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
        <span className="toggle-status">{labelEnabled ? 'Label ON' : 'Label OFF'}</span>
      </div>

      <div className={labelEnabled ? '' : 'disabled-section'}>
        <div className="s-divider"></div>

        <div className="seg-group">
          {labelTypes.map(t => (
            <label key={t.value} className={labelType === t.value ? 'seg-active' : ''}>
              <input
                type="radio"
                name="labelType"
                value={t.value}
                checked={labelType === t.value}
                onChange={() => onLabelTypeChange(t.value)}
              />
              {t.label}
            </label>
          ))}
        </div>

        <div className="toolbar-row">
          <button className="btn btn-red" onClick={handleAddLineBreak}>+ Line Break</button>
          <button className="btn btn-teal" onClick={handleRemoveLineBreak}>&#8722; Line Break</button>
          <button className="btn btn-green btn-push-right" onClick={handleExtractContent}>
            &#11015; Extract content
          </button>
        </div>

        <div className="editor-wrapper">
          <LineNumbers value={customLabels} gutterRef={lineNumsRef} />
          <textarea
            className="editor-textarea editor-textarea-short"
            ref={textareaRef}
            value={customLabels}
            onChange={e => onCustomLabelsChange(e.target.value)}
            onScroll={handleScroll}
            placeholder={"Label for QR 1\nLabel for QR 2"}
            spellCheck={false}
            maxLength={LIMITS.maxEntries * LIMITS.maxLabelLength}
          />
        </div>

        {mismatch && labelEnabled && labelType === 'custom' && (
          <div className="mismatch-warn">
            &#9888; {labelCount} labels but {qrCount} QR codes
          </div>
        )}
      </div>
    </div>
  );
}
