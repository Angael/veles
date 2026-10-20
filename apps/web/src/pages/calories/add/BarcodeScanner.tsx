import { SwitchCameraIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { RouteBackButton } from '@/components/app/app-frame/RouteBackButton';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import css from './BarcodeScanner.module.css';
import { getFoodBarcode } from '../foodBarcode';
import { createDetector } from './barcodeDetector';
import { ScannerMessage, type ScannerState } from './ScannerMessage';
import type { LookupState } from './ScanStatusPanel';
import { useCameraPreference } from './useCameraPreference';

type BarcodeScannerProps = {
  /** Lookup progress for the last detected barcode; drives the alignment guide state. */
  lookup: LookupState['status'];
  onDetected: (barcode: string) => void;
};

const guideHints: Record<LookupState['status'], string> = {
  error: 'Point at a barcode to scan it',
  idle: 'Fit the barcode inside the frame',
  lookingUp: 'Barcode detected',
  notFound: 'Point at another barcode',
};

const detectionIntervalMs = 250;
const barcodeAbsentResetMs = 1000;

/** Requests continuous autofocus on browsers that expose the camera focus controls. */
async function enableContinuousFocus(stream: MediaStream) {
  const track = stream.getVideoTracks()[0];
  if (!track) return;
  const capabilities: MediaTrackCapabilities & { focusMode?: string[] } = track.getCapabilities();
  if (!capabilities.focusMode?.includes('continuous')) return;
  const constraints: MediaTrackConstraints & {
    advanced: Array<MediaTrackConstraintSet & { focusMode: string }>;
  } = { advanced: [{ focusMode: 'continuous' }] };
  await track.applyConstraints(constraints);
}

export function BarcodeScanner({ lookup, onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const callbackRef = useRef(onDetected);
  callbackRef.current = onDetected;
  const [state, setState] = useState<ScannerState>('starting');
  const {
    cameras,
    cameraHintVisible,
    cameraNotice,
    cameraNoticeVisible,
    cameraPreferenceReady,
    clearUnavailablePreference,
    preferredCameraId,
    registerActiveCamera,
    selectNextCamera,
  } = useCameraPreference();
  useEffect(() => {
    if (!cameraPreferenceReady) return;
    let active = true;
    let animationFrame = 0;
    let stream: MediaStream | undefined;
    let detecting = false;
    let lastDetection = 0;
    let lastDetectedBarcode = '';
    let lastDetectedAt = 0;

    const stopCamera = () => {
      cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach((track) => track.stop());
      stream = undefined;
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    /** Starts the saved camera when available, otherwise the preferred rear camera, then scans. */
    async function startScanner() {
      // Browser APIs may be absent at runtime despite the DOM typings requiring them.
      // oxlint-disable-next-line typescript/no-unnecessary-condition -- Older or restricted browsers may not expose mediaDevices or getUserMedia.
      if (!navigator.mediaDevices?.getUserMedia) {
        setState('unavailable');
        return;
      }

      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: preferredCameraId
            ? {
                deviceId: { exact: preferredCameraId },
                height: { ideal: 1080 },
                width: { ideal: 1920 },
              }
            : {
                facingMode: { ideal: 'environment' },
                height: { ideal: 1080 },
                width: { ideal: 1920 },
              },
        });
        stream = cameraStream;

        const detector = await createDetector();
        if (!active) {
          stopCamera();
          return;
        }

        await enableContinuousFocus(cameraStream).catch(() => undefined);
        const videoTrack = cameraStream.getVideoTracks()[0];
        const activeDeviceId = videoTrack?.getSettings().deviceId ?? '';
        const availableCameras = (await navigator.mediaDevices.enumerateDevices()).filter(
          (device) => device.kind === 'videoinput',
        );
        // Effect cleanup can flip this flag while enumerateDevices is awaiting the browser.
        // oxlint-disable-next-line typescript/no-unnecessary-condition -- The async browser boundary can invalidate the scanner after the earlier check.
        if (!active) {
          stopCamera();
          return;
        }
        registerActiveCamera(activeDeviceId, availableCameras);
        const video = videoRef.current;
        if (!video) {
          stopCamera();
          return;
        }

        video.srcObject = cameraStream;
        // Don't wait for play(): some mobile browsers keep it pending, which stuck the scanner on
        // "Starting camera". autoPlay starts the preview and the loop waits for frames itself.
        void video.play().catch(() => undefined);
        setState('scanning');

        const scan = async (timestamp: number) => {
          if (!active) return;
          if (
            !detecting &&
            timestamp - lastDetection >= detectionIntervalMs &&
            video.readyState >= 2
          ) {
            detecting = true;
            lastDetection = timestamp;
            try {
              const results = await detector.detect(video);
              const barcode = results
                .map((result) => getFoodBarcode(result.rawValue, result.format))
                .find((value) => value !== null);
              // Effect cleanup can flip this flag while detector.detect is awaiting the browser.
              // oxlint-disable-next-line typescript/no-unnecessary-condition -- Avoid invoking the callback after scanner unmount.
              if (barcode && active) {
                if (barcode !== lastDetectedBarcode) {
                  lastDetectedBarcode = barcode;
                  callbackRef.current(barcode);
                }
                lastDetectedAt = timestamp;
              } else if (timestamp - lastDetectedAt >= barcodeAbsentResetMs) {
                lastDetectedBarcode = '';
              }
            } catch {
              stopCamera();
              // Effect cleanup can flip this flag while detector.detect is awaiting the browser.
              // oxlint-disable-next-line typescript/no-unnecessary-condition -- Avoid setting state after scanner unmount.
              if (active) setState('error');
              return;
            } finally {
              detecting = false;
            }
          }
          // requestAnimationFrame requires a synchronous callback; handle scan rejections here.
          animationFrame = requestAnimationFrame((nextTimestamp) => {
            void scan(nextTimestamp).catch(() => {
              stopCamera();
              if (active) setState('error');
            });
          });
        };
        animationFrame = requestAnimationFrame((nextTimestamp) => {
          void scan(nextTimestamp).catch(() => {
            stopCamera();
            if (active) setState('error');
          });
        });
      } catch (error) {
        stopCamera();
        if (!active) return;
        if (
          error instanceof DOMException &&
          (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') &&
          clearUnavailablePreference()
        ) {
          return;
        }
        setState(
          error instanceof DOMException &&
            (error.name === 'NotAllowedError' || error.name === 'SecurityError')
            ? 'permissionDenied'
            : 'error',
        );
      }
    }

    void startScanner();
    return () => {
      active = false;
      stopCamera();
    };
  }, [cameraPreferenceReady, preferredCameraId]);

  function switchCamera() {
    if (!selectNextCamera()) return;
    setState('starting');
  }

  const isScanning = state === 'scanning';

  return (
    <section aria-label='Barcode camera scanner' className={css.scanner}>
      <div className={css.header}>
        <RouteBackButton variant='ghost' />
        <h1>Scan barcode</h1>
      </div>

      <div
        aria-busy={lookup === 'lookingUp' || undefined}
        className={css.viewport}
        data-lookup={lookup}
      >
        <video aria-label='Live camera preview' autoPlay muted playsInline ref={videoRef} />
        {isScanning ? (
          <div className={css.guideLayer}>
            <div className={css.guide}>
              <span className={css.scanLine} />
            </div>
            <p className={css.guideHint}>{guideHints[lookup]}</p>
          </div>
        ) : (
          <ScannerMessage state={state} />
        )}
        {isScanning && cameras.length > 1 ? (
          <div className={css.cameraControls}>
            <div
              aria-live='polite'
              className={css.cameraNotice}
              data-visible={cameraNoticeVisible ? '' : undefined}
            >
              {cameraNotice}
            </div>
            <Btn
              aria-label='Switch camera'
              className={css.switchCamera}
              icon={<SwitchCameraIcon aria-hidden='true' />}
              iconOnly
              onClick={switchCamera}
              variant='ghost'
            />
          </div>
        ) : null}
        {isScanning && cameraHintVisible ? (
          <Card className={css.cameraHint} shadow={false} tone='primary'>
            If the image looks blurry, try switching to another rear camera.
          </Card>
        ) : null}
      </div>
    </section>
  );
}
