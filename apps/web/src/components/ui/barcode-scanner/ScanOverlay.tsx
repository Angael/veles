import { useState } from 'react';
import css from './ScanOverlay.module.css';
import type { ScannedBarcode } from './useBarcodeScanner';

/** Bar `[x, width]` pairs of the faint sample barcode inside the guide frame. */
const guideBars = [
  [24, 2],
  [28, 1],
  [31, 3],
  [36, 1],
  [39, 2],
  [43, 1],
  [46, 4],
  [52, 1],
  [55, 2],
  [59, 1],
  [62, 3],
  [67, 1],
  [70, 2],
  [74, 1],
  [77, 3],
  [82, 1],
  [85, 2],
  [89, 1],
  [92, 3],
] as const;

const guideCorners = [
  'M 8 24 V 14 A 6 6 0 0 1 14 8 H 24',
  'M 96 8 H 106 A 6 6 0 0 1 112 14 V 24',
  'M 112 56 V 66 A 6 6 0 0 1 106 72 H 96',
  'M 24 72 H 14 A 6 6 0 0 1 8 66 V 56',
];

/**
 * Shows where to point the camera for a moment after it starts: corner brackets snap around a
 * faint barcode while a scan line sweeps across it, then everything fades out.
 */
export function ScanGuide() {
  return (
    <svg aria-hidden='true' className={css.guide} viewBox='0 0 120 80'>
      <g className={css.guideBars}>
        {guideBars.map(([x, width]) => (
          <rect height={36} key={x} width={width} x={x} y={22} />
        ))}
      </g>
      <g className={css.guideCorners}>
        {guideCorners.map((d) => (
          <path d={d} key={d} />
        ))}
      </g>
      <g className={css.guideLine}>
        <line x1={16} x2={104} y1={40} y2={40} />
        <line x1={16} x2={104} y1={40} y2={40} />
      </g>
    </svg>
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
