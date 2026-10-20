import { useState } from 'react';
import { BarcodeOutline, ScanGuide } from '@/components/ui/barcode-scanner/ScanOverlay';
import { useBarcodeScanner } from '@/components/ui/barcode-scanner/useBarcodeScanner';
import { Btn } from '@/components/ui/btn/Btn';
import { CameraSwitch } from '@/components/ui/camera/CameraSwitch';
import { CameraView } from '@/components/ui/camera/CameraView';
import { useCamera } from '@/components/ui/camera/useCamera';
import { useStoredCameraId } from '@/components/ui/camera/useStoredCameraId';
import css from './ComponentsDemoPage.module.css';

export function CameraDemo() {
  const [started, setStarted] = useState(false);

  return (
    <section>
      <h2>Camera and barcode scanner</h2>
      {started ? <BarcodeCamera /> : <Btn onClick={() => setStarted(true)}>Start camera</Btn>}
    </section>
  );
}

function BarcodeCamera() {
  const [deviceId, setDeviceId] = useStoredCameraId();
  const [scanned, setScanned] = useState<string>();
  const camera = useCamera(deviceId);
  const live = camera.status === 'live';
  const scanner = useBarcodeScanner(camera.videoRef, { enabled: live, onScan: setScanned });

  return (
    <>
      <div className={css.cameraDemo}>
        <CameraView camera={camera}>
          {live ? (
            <>
              <ScanGuide />
              <BarcodeOutline barcode={scanner.barcode} />
              <CameraSwitch activeDeviceId={camera.activeDeviceId} onSwitch={setDeviceId} />
            </>
          ) : null}
        </CameraView>
      </div>
      <p>Last scan: {scanned ?? 'none'}</p>
    </>
  );
}
