import type { ReactNode } from 'react';
import { BarcodeOutline, ScanGuide } from '@/components/ui/barcode-scanner/ScanOverlay';
import { useBarcodeScanner } from '@/components/ui/barcode-scanner/useBarcodeScanner';
import { CameraSwitch } from '@/components/ui/camera/CameraSwitch';
import { CameraView } from '@/components/ui/camera/CameraView';
import { useCamera } from '@/components/ui/camera/useCamera';
import { useStoredCameraId } from '@/components/ui/camera/useStoredCameraId';
import { getFoodBarcode } from '../foodBarcode';
import css from './BarcodeScanner.module.css';
import { ScanNotice } from './ScanNotice';
import { useI18n } from '@/lib/i18n/I18nProvider';

type BarcodeScannerProps = {
  /** Feedback shown over the bottom of the preview, so the layout never shifts. */
  notice?: ReactNode;
  onScan: (barcode: string) => void;
};

/** Camera preview that reads food barcodes and outlines the one in view. */
export function BarcodeScanner({ notice, onScan }: BarcodeScannerProps) {
  const { t } = useI18n();
  const [deviceId, setDeviceId] = useStoredCameraId();
  const camera = useCamera(deviceId);
  const live = camera.status === 'live';
  const scanner = useBarcodeScanner(camera.videoRef, {
    enabled: live,
    onScan,
    read: (barcode) => getFoodBarcode(barcode.rawValue, barcode.format),
  });

  return (
    <CameraView camera={camera}>
      {live ? (
        <>
          <ScanGuide />
          <BarcodeOutline barcode={scanner.barcode} />
          <CameraSwitch activeDeviceId={camera.activeDeviceId} onSwitch={setDeviceId} />
        </>
      ) : null}
      <div aria-live='polite' className={css.notice}>
        {scanner.failed ? (
          <ScanNotice
            detail={t({
              en: 'Type the barcode below instead.',
              pl: 'Zamiast tego wpisz kod kreskowy poniżej.',
            })}
            title={t({ en: 'Scanner stopped', pl: 'Skaner zatrzymany' })}
            tone='danger'
          />
        ) : (
          notice
        )}
      </div>
    </CameraView>
  );
}
