export default function BottomBar({ onGenerate, isRunning, progress, statusMsg }) {
  return (
    <div className="bottom-bar">
      <div className="bottom-bar-inner">
        <button
          className="download-btn"
          disabled={isRunning}
          onClick={onGenerate}
        >
          {isRunning ? 'Generating…' : '⬇ Generate & Download ZIP'}
        </button>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="status-msg">{statusMsg}</div>
      </div>
    </div>
  );
}
