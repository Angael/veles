import { CameraIcon, CameraOffIcon } from 'lucide-react';
import css from './BarcodeScanner.module.css';

export type ScannerState = 'starting' | 'scanning' | 'permissionDenied' | 'unavailable' | 'error';

export function ScannerMessage({ state }: { state: Exclude<ScannerState, 'scanning'> }) {
  if (state === 'starting') {
    return (
      <div className={css.message} role='status'>
        <CameraIcon aria-hidden='true' />
        <strong>Starting camera…</strong>
        <span>You may be asked for permission.</span>
      </div>
    );
  }

  const copy = scannerMessageCopy[state];

  return (
    <div className={css.message} role='alert'>
      <CameraOffIcon aria-hidden='true' />
      <strong>{copy[0]}</strong>
      <span>{copy[1]}</span>
    </div>
  );
}

const scannerMessageCopy: Record<
  Exclude<ScannerState, 'starting' | 'scanning'>,
  [string, string]
> = {
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
    'We could not read from the camera. Go back and try again, or type the barcode.',
  ],
};
