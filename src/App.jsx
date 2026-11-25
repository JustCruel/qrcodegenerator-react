import { useState, useMemo } from 'react';
import './App.css';

import Header         from './components/Header.jsx';
import QRDataEditor   from './components/QRDataEditor.jsx';
import FilenameEditor from './components/FilenameEditor.jsx';
import LabelEditor    from './components/LabelEditor.jsx';
import PreviewPanel   from './components/PreviewPanel.jsx';
import ResultModal    from './components/ResultModal.jsx';
import BottomBar      from './components/BottomBar.jsx';

import { useSettings }    from './hooks/useSettings.js';
import { useQRGenerator } from './hooks/useQRGenerator.js';

export default function App() {
  // ---- QR Data ----
  const [qrData, setQrData] = useState('');

  // ---- Filename ----
  const [filenameType, setFilenameType]       = useState('custom');
  const [customFilenames, setCustomFilenames] = useState('');

  // ---- Labels ----
  const [labelEnabled, setLabelEnabled]   = useState(true);
  const [labelType, setLabelType]         = useState('custom');
  const [customLabels, setCustomLabels]   = useState('');

  // ---- Settings ----
  const { settings, updateSetting, updateMarginAll, resetDefaults } = useSettings();

  // ---- Generator ----
  const { generate, progress, statusMsg, isRunning, results, closeModal } = useQRGenerator();

  // ---- Derived values ----
  const qrLines = useMemo(
    () => qrData.split('\n').filter(l => l.trim()),
    [qrData]
  );

  const customFilenameLines = useMemo(() => customFilenames.split('\n'), [customFilenames]);
  const customLabelLines    = useMemo(() => customLabels.split('\n'),    [customLabels]);

  const filenameCount = useMemo(
    () => customFilenameLines.filter(l => l.trim()).length,
    [customFilenameLines]
  );
  const labelCount = useMemo(
    () => customLabelLines.filter(l => l.trim()).length,
    [customLabelLines]
  );

  const filenameMismatch =
    filenameType === 'custom' &&
    filenameCount > 0 &&
    qrLines.length > 0 &&
    filenameCount !== qrLines.length;

  const labelMismatch =
    labelEnabled &&
    labelType === 'custom' &&
    labelCount > 0 &&
    qrLines.length > 0 &&
    labelCount !== qrLines.length;

  // ---- Handlers ----
  const handleQRDataChange = ({ qrData: newData, demoFilenames, demoLabels }) => {
    if (newData !== undefined) setQrData(newData);
    if (demoFilenames !== undefined) {
      setCustomFilenames(demoFilenames);
      setFilenameType('custom');
    }
    if (demoLabels !== undefined) {
      setCustomLabels(demoLabels);
      setLabelEnabled(true);
      setLabelType('custom');
    }
  };

  const handleImport = ({ urls, filenames, labels }) => {
    setQrData(urls.join('\n'));
    if (filenames.some(v => v)) {
      setCustomFilenames(filenames.join('\n'));
      setFilenameType('custom');
    }
    if (labels.some(v => v)) {
      setCustomLabels(labels.join('\n'));
      setLabelEnabled(true);
      setLabelType('custom');
    }
  };

  const handleGenerate = () => {
    generate({
      qrLines,
      labelEnabled,
      labelType,
      customLabelLines,
      filenameType,
      customFilenameLines,
      settings,
    });
  };

  const handleRedownload = () => {
    closeModal();
    handleGenerate();
  };

  return (
    <>
      <Header />

      <div className="main">
        {/* Left panel */}
        <div className="left-panel">
          <QRDataEditor
            value={qrData}
            onChange={handleQRDataChange}
            onImport={handleImport}
            qrCount={qrLines.length}
          />

          <FilenameEditor
            filenameType={filenameType}
            onFilenameTypeChange={setFilenameType}
            customFilenames={customFilenames}
            onCustomFilenamesChange={setCustomFilenames}
            qrCount={qrLines.length}
            filenameCount={filenameCount}
            mismatch={filenameMismatch}
          />

          <LabelEditor
            labelEnabled={labelEnabled}
            onLabelEnabledChange={setLabelEnabled}
            labelType={labelType}
            onLabelTypeChange={setLabelType}
            customLabels={customLabels}
            onCustomLabelsChange={setCustomLabels}
            qrData={qrData}
            qrCount={qrLines.length}
            labelCount={labelCount}
            mismatch={labelMismatch}
          />
        </div>

        {/* Right panel */}
        <PreviewPanel
          settings={settings}
          onSettingChange={updateSetting}
          onMarginAllChange={updateMarginAll}
          onResetDefaults={resetDefaults}
          qrLines={qrLines}
          labelEnabled={labelEnabled}
          labelType={labelType}
          customLabelLines={customLabelLines}
          filenameType={filenameType}
          customFilenameLines={customFilenameLines}
        />
      </div>

      <BottomBar
        onGenerate={handleGenerate}
        isRunning={isRunning}
        progress={progress}
        statusMsg={statusMsg}
      />

      <ResultModal
        results={results}
        onClose={closeModal}
        onDownloadAll={handleRedownload}
      />
    </>
  );
}
