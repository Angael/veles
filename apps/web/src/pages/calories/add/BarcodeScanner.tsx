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
import { debugLog } from './scanDebug';
import { ScanDebugPanel } from './ScanDebugPanel';

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
const fullHd = { height: { ideal: 1080 }, width: { ideal: 1920 } };

/**
 * Opens the saved camera, then rear cameras, with looser settings on each failure. Some phones
 * (Samsung S21+) reject a specific back camera with NotReadableError, so one failed request must
 * not stop the scanner.
 */
async function openCamera(preferredCameraId: string) {
  const attempts: MediaTrackConstraints[] = [
    ...(preferredCameraId
      ? [
          { deviceId: { exact: preferredCameraId }, ...fullHd },
          { deviceId: { exact: preferredCameraId } },
        ]
      : []),
    { facingMode: { ideal: 'environment' }, ...fullHd },
    { facingMode: { ideal: 'environment' } },
    {},
  ];
  let lastError: unknown;
  for (const video of attempts) {
    debugLog('getUserMedia.request', video);
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: video.deviceId || video.facingMode ? video : true,
      });
    } catch (error) {
      debugLog('getUserMedia.error', { constraints: video, error });
      lastError = error;
      if (
        error instanceof DOMException &&
        (error.name === 'NotAllowedError' || error.name === 'SecurityError')
      ) {
        throw error;
      }
    }
  }
  throw lastError;
}
const barcodeAbsentResetMs = 1000;

/** Requests continuous autofocus on browsers that expose the camera focus controls. */
async function enableContinuousFocus(stream: MediaStream) {
  const track = stream.getVideoTracks()[0];
  if (!track) return;
  const capabilities: MediaTrackCapabilities & { focusMode?: string[] } = track.getCapabilities();
  debugLog('focus.capabilities', capabilities.focusMode);
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
    debugLog('scanner.state', state);
  }, [state]);

  useEffect(() => {
    debugLog('effect.run', { cameraPreferenceReady, preferredCameraId });
    if (!cameraPreferenceReady) return;
    let active = true;
    let animationFrame = 0;
    let stream: MediaStream | undefined;
    let detecting = false;
    let lastDetection = 0;
    let lastDetectedBarcode = '';
    let lastDetectedAt = 0;
    let detectCount = 0;

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
        try {
          const before = await navigator.mediaDevices.enumerateDevices();
          debugLog(
            'devices.beforeStart',
            before.filter((device) => device.kind === 'videoinput'),
          );
        } catch (error) {
          debugLog('devices.beforeStart.error', error);
        }
        const gumStartedAt = performance.now();
        const cameraStream = await openCamera(preferredCameraId);
        stream = cameraStream;
        const track = cameraStream.getVideoTracks()[0];
        debugLog('getUserMedia.ok', {
          ms: Math.round(performance.now() - gumStartedAt),
          track,
          tracks: cameraStream.getTracks().length,
        });
        if (track) {
          for (const name of ['ended', 'mute', 'unmute'] as const) {
            track.addEventListener(name, () => debugLog(`track.${name}`, track));
          }
        }

        const detector = await createDetector();
        debugLog('detector.ready', detector.constructor.name);
        if (!active) {
          stopCamera();
          return;
        }

        await enableContinuousFocus(cameraStream).catch((error: unknown) =>
          debugLog('focus.error', error),
        );
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
        debugLog('devices.afterStart', { activeDeviceId, availableCameras });
        registerActiveCamera(activeDeviceId, availableCameras);
        const video = videoRef.current;
        if (!video) {
          stopCamera();
          return;
        }

        for (const name of [
          'loadedmetadata',
          'loadeddata',
          'canplay',
          'playing',
          'pause',
          'waiting',
          'stalled',
          'suspend',
          'emptied',
          'ended',
          'error',
          'resize',
        ] as const) {
          video.addEventListener(name, () =>
            debugLog(`video.${name}`, {
              error: video.error ? { code: video.error.code, message: video.error.message } : null,
              paused: video.paused,
              readyState: video.readyState,
              size: `${video.videoWidth}x${video.videoHeight}`,
              box: `${video.clientWidth}x${video.clientHeight}`,
            }),
          );
        }
        video.srcObject = cameraStream;
        // Don't wait for play(): some mobile browsers keep it pending, which stuck the scanner on
        // "Starting camera". autoPlay starts the preview and the loop waits for frames itself.
        video
          .play()
          .then(() => debugLog('video.play.ok'))
          .catch((error: unknown) => debugLog('video.play.error', error));
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
              const detectStartedAt = performance.now();
              const results = await detector.detect(video);
              detectCount += 1;
              if (detectCount <= 3 || detectCount % 40 === 0 || results.length > 0) {
                debugLog('detect.result', {
                  count: detectCount,
                  ms: Math.round(performance.now() - detectStartedAt),
                  results: results.map((result) => ({
                    format: result.format,
                    rawValue: result.rawValue,
                  })),
                  size: `${video.videoWidth}x${video.videoHeight}`,
                });
              }
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
            } catch (error) {
              debugLog('detect.error', {
                count: detectCount,
                error,
                readyState: video.readyState,
                size: `${video.videoWidth}x${video.videoHeight}`,
                track: stream?.getVideoTracks()[0],
              });
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
            void scan(nextTimestamp).catch((error: unknown) => {
              debugLog('scan.error', error);
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
        debugLog('start.error', { active, error });
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
      debugLog('effect.cleanup', { preferredCameraId });
      active = false;
      stopCamera();
    };
  }, [cameraPreferenceReady, preferredCameraId]);

  function switchCamera() {
    const next = selectNextCamera();
    debugLog('camera.switch', { next });
    if (!next) return;
    setState('starting');
  }

  const isScanning = state === 'scanning';

  return (
    <section aria-label='Barcode camera scanner' className={css.scanner}>
      <ScanDebugPanel />
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
