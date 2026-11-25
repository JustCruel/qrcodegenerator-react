import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { LIMITS } from './constants.js';

/**
 * Generate a composite canvas with QR code + optional label + margins.
 * Returns a Promise<HTMLCanvasElement>.
 */
export async function generateQRCanvas(text, labelText, s) {
  if (!text || !text.trim()) throw new Error('Empty');
  if (text.length > LIMITS.maxTextLength) throw new Error('Text too long');

  const qrSize   = s.qrSize;
  const mTop     = s.marginTop    || 0;
  const mRight   = s.marginRight  || 0;
  const mBottom  = s.marginBottom || 0;
  const mLeft    = s.marginLeft   || 0;
  const totalW   = mLeft + qrSize + mRight;
  const showLabel = !!(labelText && s.dataDisplay !== 'none');
  const gap      = showLabel ? Math.max(-s.fontSize * 0.8, s.fontSpacing) : 0;
  const labelH   = showLabel ? gap + s.fontSize : 0;
  const totalH   = mTop + qrSize + labelH + mBottom;

  // Use the npm qrcode package to render to a temp canvas
  const tempCanvas = document.createElement('canvas');
  await QRCode.toCanvas(tempCanvas, text.trim(), {
    width: qrSize,
    color: { dark: s.qrColorDark, light: s.qrColorLight },
    errorCorrectionLevel: 'H',
  });

  // Composite output canvas
  const out = document.createElement('canvas');
  out.width  = totalW;
  out.height = totalH;
  const ctx = out.getContext('2d');

  ctx.fillStyle = s.bgColor;
  ctx.fillRect(0, 0, totalW, totalH);

  const cx = totalW / 2;

  const drawLabel = (yBaseline) => {
    if (!showLabel) return;
    ctx.save();
    ctx.fillStyle   = s.labelColor;
    ctx.font        = `${s.fontStyle} ${s.fontWeight} ${s.fontSize}px ${s.fontFamily}`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'alphabetic';
    const maxW = totalW - 10;
    let t = labelText;
    if (ctx.measureText(t).width > maxW) {
      while (ctx.measureText(t + '…').width > maxW && t.length > 0) t = t.slice(0, -1);
      t += '…';
    }
    ctx.fillText(t, cx, yBaseline);
    ctx.restore();
  };

  if (s.dataDisplay === 'top' && showLabel) {
    const yBaseline = mTop + gap + s.fontSize;
    drawLabel(yBaseline);
    ctx.drawImage(tempCanvas, mLeft, mTop + labelH, qrSize, qrSize);
  } else {
    ctx.drawImage(tempCanvas, mLeft, mTop, qrSize, qrSize);
    if (showLabel) {
      const yBaseline = mTop + qrSize + gap + s.fontSize;
      drawLabel(yBaseline);
    }
  }

  return out;
}

/**
 * Verify a QR canvas by decoding with jsQR.
 * Returns { ok: boolean|null, decoded: string|null }
 */
export function verifyQRCanvas(canvas, expectedText) {
  try {
    const ctx = canvas.getContext('2d');
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(data, width, height);
    if (!result) return { ok: false, decoded: null };
    const ok = result.data.trim() === expectedText.trim();
    return { ok, decoded: result.data };
  } catch {
    return { ok: false, decoded: null };
  }
}
