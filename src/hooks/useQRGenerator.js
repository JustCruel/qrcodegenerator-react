import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateQRCanvas, verifyQRCanvas } from '../utils/qrCanvas.js';
import { getFilename, dataUrlToBlob } from '../utils/fileHelpers.js';
import { LIMITS } from '../utils/constants.js';

export function useQRGenerator() {
  const [progress, setProgress]   = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults]     = useState(null); // null = modal closed

  const generate = useCallback(async ({
    qrLines,
    labelEnabled,
    labelType,
    customLabelLines,
    filenameType,
    customFilenameLines,
    settings,
  }) => {
    if (qrLines.length === 0) {
      setStatusMsg('Please enter at least one URL or text in the QR Code data field.');
      return;
    }
    if (qrLines.length > LIMITS.maxEntries) {
      setStatusMsg(`Too many entries (max ${LIMITS.maxEntries} per batch).`);
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setStatusMsg('Starting…');

    const getLabel = (url, index) => {
      if (!labelEnabled) return '';
      if (labelType === 'content') return url;
      return (customLabelLines[index] || '').trim();
    };

    try {
      const zip = new JSZip();
      const usedNames = {};
      const generatedResults = [];

      for (let i = 0; i < qrLines.length; i++) {
        const url   = qrLines[i];
        const label = getLabel(url, i);
        let filename = getFilename(url, i, filenameType, customFilenameLines);

        if (usedNames[filename]) {
          usedNames[filename]++;
          filename = `${filename}_${usedNames[filename]}`;
        } else {
          usedNames[filename] = 1;
        }

        setProgress(Math.round((i / qrLines.length) * 90));
        setStatusMsg(`Generating ${i + 1} / ${qrLines.length}…`);

        await new Promise(r => setTimeout(r, 0));

        try {
          const qrCanvas     = await generateQRCanvas(url, label, settings);
          const verification = verifyQRCanvas(qrCanvas, url);
          const dataUrl      = qrCanvas.toDataURL('image/png');
          const blob         = dataUrlToBlob(dataUrl);
          zip.file(`${filename}.png`, blob);
          generatedResults.push({
            url,
            label,
            filename,
            dataUrl,
            verified: verification.ok,
            decoded:  verification.decoded,
          });
        } catch (e) {
          console.warn(`Skipped [${i + 1}]: ${e.message}`);
        }
      }

      setProgress(95);
      setStatusMsg('Packing ZIP file…');

      const zipBlob = await zip.generateAsync({ type: 'blob' }, (meta) => {
        setProgress(95 + meta.percent * 0.05);
      });

      saveAs(zipBlob, 'qrcodes.zip');
      setProgress(100);

      const total    = generatedResults.length;
      const skipped  = qrLines.length - total;
      const verified = generatedResults.filter(r => r.verified === true).length;
      const failed   = generatedResults.filter(r => r.verified === false).length;
      const verifySummary = ` · ${verified} ✓ verified${failed > 0 ? ` · ${failed} ✗ failed` : ''}`;
      const skipSummary   = skipped > 0 ? ` · ${skipped} skipped` : '';
      setStatusMsg(
        `✓ Done! ${total} QR code${total !== 1 ? 's' : ''} downloaded${verifySummary}${skipSummary}.`
      );

      setResults(generatedResults);

      setTimeout(() => {
        setProgress(0);
        setStatusMsg('');
      }, 4000);

    } catch (e) {
      setStatusMsg('Something went wrong while generating the QR codes. Please try again.');
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const closeModal = useCallback(() => setResults(null), []);

  return { generate, progress, statusMsg, isRunning, results, closeModal };
}
