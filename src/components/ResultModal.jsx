import { dataUrlToBlob } from '../utils/fileHelpers.js';
import { saveAs } from 'file-saver';

export default function ResultModal({ results, onClose, onDownloadAll }) {
  if (!results) return null;

  const total    = results.length;
  const verified = results.filter(r => r.verified === true).length;
  const failed   = results.filter(r => r.verified === false).length;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <div className="modal-title">Generated QR Codes</div>
            <div className="modal-sub">
              {total} QR code{total !== 1 ? 's' : ''} generated
              &nbsp;&nbsp;
              <span className="vsumm-ok">&#10003; {verified} verified</span>
              {failed > 0 && (
                <>&nbsp;<span className="vsumm-fail">&#10007; {failed} failed</span></>
              )}
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-green" onClick={onDownloadAll}>&#11015; Download ZIP</button>
            <button className="modal-close" onClick={onClose}>&#10005;</button>
          </div>
        </div>

        <div className="modal-grid">
          {results.map((item) => {
            const { url, label, filename, dataUrl, verified: ok, decoded } = item;
            const urlShort = url.length > 60 ? url.slice(0, 60) + '…' : url;

            return (
              <div
                key={filename}
                className={`modal-card${ok === false ? ' modal-card-fail' : ''}`}
              >
                <img src={dataUrl} alt={filename} />

                {ok === true && (
                  <span className="verify-badge verify-ok">&#10003; Verified</span>
                )}
                {ok === false && (
                  <span
                    className="verify-badge verify-fail"
                    title={`Decoded: ${(decoded || '(none)').slice(0, 80)}`}
                  >&#10007; Mismatch</span>
                )}

                <div className="modal-card-name">{filename}.png</div>
                <div className="modal-card-url">{urlShort}</div>
                {label && <div className="modal-card-label">{label}</div>}

                <button
                  className="modal-card-dl"
                  onClick={() => saveAs(dataUrlToBlob(dataUrl), filename + '.png')}
                >
                  &#11015; Save
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
