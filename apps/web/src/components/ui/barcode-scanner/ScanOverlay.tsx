import { ScanBarcodeIcon } from 'lucide-react';
import { useState } from 'react';
import css from './ScanOverlay.module.css';
import type { ScannedBarcode } from './useBarcodeScanner';

/** Shows where to point the camera for a moment after it starts, then fades out. */
export function ScanGuide() {
  return (
    <ScanBarcodeIcon absoluteStrokeWidth aria-hidden='true' className={css.guide} strokeWidth={3} />
  );
}

/**
 * Outlines the barcode in view. The SVG uses video pixels and crops like `object-fit: cover`, so
 * the corners land on the barcode without any coordinate math.
 */
export function BarcodeOutline({ barcode }: { barcode: ScannedBarcode | null }) {
  // Keep the last barcode while the outline fades out.
  const [shown, setShown] = useState(barcode);
  if (barcode && barcode !== shown) setShown(barcode);
  if (!shown) return null;

  const { corners, frame } = shown;
  return (
    <svg
      aria-hidden='true'
      className={css.outline}
      data-visible={barcode ? '' : undefined}
      preserveAspectRatio='xMidYMid slice'
      viewBox={`0 0 ${frame.width} ${frame.height}`}
    >
      <path d={`M ${corners.map(({ x, y }) => `${x} ${y}`).join(' L ')} Z`} />
    </svg>
  );
}
