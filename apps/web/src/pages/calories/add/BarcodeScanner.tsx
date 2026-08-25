import type {
  BarcodeDetector as PolyfillBarcodeDetector,
  BarcodeFormat,
} from 'barcode-detector/pure';
import { CameraIcon, CameraOffIcon, SwitchCameraIcon, XIcon } from 'lucide-react';
import { type ReactElement, useEffect, useRef, useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import css from './BarcodeScanner.module.css';
import { useCameraPreference } from './useCameraPreference';

type BarcodeDetectorLike = Pick<PolyfillBarcodeDetector, 'detect'>;
type BarcodeDetectorConstructor = new (options: {
  formats: BarcodeFormat[];
}) => BarcodeDetectorLike;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

type ScannerState = 'starting' | 'scanning' | 'permissionDenied' | 'unavailable' | 'error';

type BarcodeScannerProps = {
  closeRender: ReactElement;
  onDetected: (barcode: string) => void;
};

const formats: BarcodeFormat[] = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'];

/** Uses the native detector when available and only downloads the WASM-backed fallback when needed. */
async function createDetector(): Promise<BarcodeDetectorLike> {
  if (window.BarcodeDetector) {
    return new window.BarcodeDetector({ formats });
  }

  // A static import would execute the polyfill in the initial client bundle on browsers with native support.
  const { BarcodeDetector } = await import('barcode-detector/pure');
  return new BarcodeDetector({ formats });
}

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

export function BarcodeScanner({ closeRender, onDetected }: BarcodeScannerProps) {
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

    const stopCamera = () => {
      cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach((track) => track.stop());
      stream = undefined;
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    /** Starts the saved camera when available, otherwise the preferred rear camera, then scans. */
    async function startScanner() {
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
        await video.play();
        setState('scanning');

        const scan = async (timestamp: number) => {
          if (!active) return;
          if (!detecting && timestamp - lastDetection >= 250 && video.readyState >= 2) {
            detecting = true;
            lastDetection = timestamp;
            try {
              const results = await detector.detect(video);
              const barcode = results.find((result) => result.rawValue.trim())?.rawValue.trim();
              if (barcode && active) callbackRef.current(barcode);
            } catch {
              stopCamera();
              if (active) setState('error');
              return;
            } finally {
              detecting = false;
            }
          }
          animationFrame = requestAnimationFrame(scan);
        };
        animationFrame = requestAnimationFrame(scan);
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

  return (
    <section aria-label='Barcode camera scanner' className={css.scanner}>
      <div className={css.header}>
        <div>
          <h3>Scan a barcode</h3>
          <p>Hold the package steady with the barcode visible.</p>
        </div>
        <Btn
          aria-label='Close camera'
          icon={<XIcon aria-hidden='true' />}
          iconOnly
          isLink
          render={closeRender}
          variant='ghost'
        />
      </div>

      <div className={css.viewport}>
        <video aria-label='Live camera preview' muted playsInline ref={videoRef} />
        {state !== 'scanning' ? <ScannerMessage state={state} /> : null}
        {cameras.length > 1 ? (
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
        {state === 'scanning' && cameraHintVisible ? (
          <Card className={css.cameraHint} shadow={false} variant='primary'>
            If the image looks blurry, try switching to another rear camera.
          </Card>
        ) : null}
      </div>
      {state === 'scanning' ? (
        <p aria-live='polite' className={css.status}>
          Looking for an EAN or UPC barcode…
        </p>
      ) : null}
    </section>
  );
}

function ScannerMessage({ state }: { state: Exclude<ScannerState, 'scanning'> }) {
  if (state === 'starting') {
    return (
      <div className={css.message}>
        <CameraIcon aria-hidden='true' />
        <strong>Starting camera…</strong>
        <span>You may be asked for permission.</span>
      </div>
    );
  }

  const copy =
    state === 'permissionDenied'
      ? [
          'Camera permission denied',
          'Allow camera access in your browser settings, or type the barcode instead.',
        ]
      : state === 'unavailable'
        ? [
            'Camera unavailable',
            'This browser cannot access a camera. You can still type the barcode.',
          ]
        : [
            'Scanner stopped',
            'We could not read from the camera. Close it and try again, or type the barcode.',
          ];

  return (
    <div className={css.message} role='alert'>
      <CameraOffIcon aria-hidden='true' />
      <strong>{copy[0]}</strong>
      <span>{copy[1]}</span>
    </div>
  );
}
