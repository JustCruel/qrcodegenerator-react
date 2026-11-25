import { useRef } from 'react';
import LineNumbers from './LineNumbers.jsx';
import { LIMITS } from '../utils/constants.js';

export default function FilenameEditor({
  filenameType,
  onFilenameTypeChange,
  customFilenames,
  onCustomFilenamesChange,
  qrCount,
  filenameCount,
  mismatch,
}) {
  const textareaRef = useRef(null);
  const lineNumsRef = useRef(null);

  const handleScroll = () => {
    if (lineNumsRef.current && textareaRef.current) {
      lineNumsRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const types = [
    { value: 'number',  label: '# Number' },
    { value: 'content', label: '🔗 Content' },
    { value: 'custom',  label: '✎ Custom' },
  ];

  return (
    <div className="card">
      <div className="section-title">
        <span className="section-icon icon-violet">&#128194;</span>
        Custom File Name
        <span className={`count-badge${mismatch ? ' count-badge-warn' : ''}`}>
          {filenameType === 'custom' ? filenameCount : 0}
        </span>
      </div>
      <div className="section-desc">Choose how each generated PNG file will be named inside the ZIP.</div>

      <div className="seg-group">
        {types.map(t => (
          <label key={t.value} className={filenameType === t.value ? 'seg-active' : ''}>
            <input
              type="radio"
              name="filenameType"
              value={t.value}
              checked={filenameType === t.value}
              onChange={() => onFilenameTypeChange(t.value)}
            />
            {t.label}
          </label>
        ))}
      </div>

      {filenameType === 'custom' && (
        <div>
          <div className="editor-wrapper">
            <LineNumbers value={customFilenames} gutterRef={lineNumsRef} />
            <textarea
              className="editor-textarea editor-textarea-short"
              ref={textareaRef}
              value={customFilenames}
              onChange={e => onCustomFilenamesChange(e.target.value)}
              onScroll={handleScroll}
              placeholder={"my-filename-1\nmy-filename-2"}
              spellCheck={false}
              maxLength={LIMITS.maxEntries * LIMITS.maxFilenameLength}
            />
          </div>
          {mismatch && (
            <div className="mismatch-warn">
              &#9888; {filenameCount} filenames but {qrCount} QR codes
            </div>
          )}
        </div>
      )}
    </div>
  );
}
