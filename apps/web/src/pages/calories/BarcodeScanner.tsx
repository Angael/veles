import type {
  BarcodeDetector as PolyfillBarcodeDetector,
  BarcodeFormat,
} from 'barcode-detector/pure';
import { CameraIcon, CameraOffIcon, ScanBarcodeIcon, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import css from './BarcodeScanner.module.css';

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
  onClose: () => void;
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

export function BarcodeScanner({ onClose, onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const callbackRef = useRef(onDetected);
  const [state, setState] = useState<ScannerState>('starting');
  callbackRef.current = onDetected;

  useEffect(() => {
    let active = true;
    let animationFrame = 0;
    let stream: MediaStream | undefined;
    let detecting = false;
    let lastDetection = 0;

    /** Starts the rear-facing camera and runs a throttled scan loop without overlapping detection work. */
    async function startScanner() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState('unavailable');
        return;
      }

      try {
        const [detector, cameraStream] = await Promise.all([
          createDetector(),
          navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: { ideal: 'environment' } },
          }),
        ]);
        stream = cameraStream;
        const video = videoRef.current;
        if (!active || !video) {
          cameraStream.getTracks().forEach((track) => track.stop());
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
        if (!active) return;
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
      cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <section aria-label='Barcode camera scanner' className={css.scanner}>
      <div className={css.header}>
        <div>
          <h3>Scan a barcode</h3>
          <p>Hold the package steady inside the frame.</p>
        </div>
        <Btn
          aria-label='Close camera'
          icon={<XIcon aria-hidden='true' />}
          iconOnly
          onClick={onClose}
          variant='ghost'
        />
      </div>

      <div className={css.viewport}>
        <video aria-label='Live camera preview' muted playsInline ref={videoRef} />
        {state === 'scanning' ? (
          <div aria-hidden='true' className={css.guide}>
            <ScanBarcodeIcon />
          </div>
        ) : null}
        {state !== 'scanning' ? <ScannerMessage state={state} /> : null}
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
