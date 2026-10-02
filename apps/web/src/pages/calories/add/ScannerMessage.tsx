import { CameraIcon, CameraOffIcon, LoaderCircleIcon, SearchXIcon } from 'lucide-react';
import css from './BarcodeScanner.module.css';

export type ScannerState =
  | 'starting'
  | 'scanning'
  | 'lookingUp'
  | 'notFound'
  | 'permissionDenied'
  | 'unavailable'
  | 'error';

export function ScannerMessage({ state }: { state: Exclude<ScannerState, 'scanning'> }) {
  if (state === 'starting') {
    return (
      <div className={css.message}>
        <CameraIcon aria-hidden='true' />
        <strong>Starting camera…</strong>
        <span>You may be asked for permission.</span>
      </div>
    );
  }

  const copy = scannerMessageCopy[state];
  let icon = <CameraOffIcon aria-hidden='true' />;
  if (state === 'lookingUp') {
    icon = <LoaderCircleIcon aria-hidden='true' className={css.loadingIcon} />;
  } else if (state === 'notFound') {
    icon = <SearchXIcon aria-hidden='true' />;
  }

  return (
    <div className={css.message} role={state === 'lookingUp' ? 'status' : 'alert'}>
      {icon}
      <strong>{copy[0]}</strong>
      <span>{copy[1]}</span>
    </div>
  );
}

const scannerMessageCopy: Record<
  Exclude<ScannerState, 'starting' | 'scanning'>,
  [string, string]
> = {
  lookingUp: ['Looking up product…', 'Checking the product catalog.'],
  notFound: ['Barcode not found', 'Create this product or scan another barcode.'],
  permissionDenied: [
    'Camera permission denied',
    'Allow camera access in your browser settings, or type the barcode instead.',
  ],
  unavailable: [
    'Camera unavailable',
    'This browser cannot access a camera. You can still type the barcode.',
  ],
  error: [
    'Scanner stopped',
    'We could not read from the camera. Close it and try again, or type the barcode.',
  ],
};
