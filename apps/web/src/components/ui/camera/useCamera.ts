import { useEffect, useRef, useState } from 'react';

export type CameraStatus = 'starting' | 'live' | 'denied' | 'busy' | 'unavailable' | 'error';
export type Camera = ReturnType<typeof useCamera>;

/** Full HD gives barcode and text decoders enough detail without overloading phones. */
const resolution = { height: { ideal: 1080 }, width: { ideal: 1920 } };

/**
 * Streams a camera into `videoRef`. Opens `deviceId` when given, otherwise (or when that device is
 * gone) the rear camera. Restarts when `deviceId` changes and stops the camera on unmount.
 */
export function useCamera(deviceId?: string) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<CameraStatus>('starting');
  const [activeDeviceId, setActiveDeviceId] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | undefined;

    openCamera(deviceId).then(
      (opened) => {
        stream = opened;
        if (cancelled) {
          stopStream(opened);
          return;
        }
        // The video element autoplays; awaiting play() can hang on some mobile browsers.
        if (videoRef.current) videoRef.current.srcObject = opened;
        setActiveDeviceId(opened.getVideoTracks()[0]?.getSettings().deviceId);
        setStatus('live');
      },
      (error: unknown) => {
        if (!cancelled) setStatus(toCameraStatus(error));
      },
    );

    return () => {
      cancelled = true;
      if (stream) stopStream(stream);
    };
  }, [deviceId]);

  return { activeDeviceId, status, videoRef };
}

async function openCamera(deviceId: string | undefined) {
  // oxlint-disable-next-line typescript/no-unnecessary-condition -- Missing in insecure contexts and old browsers.
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new DOMException('Camera API is not available', 'NotSupportedError');
  }
  if (deviceId) {
    try {
      return await requestVideo({ deviceId: { exact: deviceId }, ...resolution });
    } catch (error) {
      if (!isMissingDevice(error)) throw error;
    }
  }
  return requestVideo({ facingMode: { ideal: 'environment' }, ...resolution });
}

async function requestVideo(video: MediaTrackConstraints) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video });
  await enableContinuousFocus(stream).catch(() => undefined);
  return stream;
}

/** Requests continuous autofocus on browsers that expose the camera focus controls. */
async function enableContinuousFocus(stream: MediaStream) {
  const track = stream.getVideoTracks()[0];
  const capabilities: (MediaTrackCapabilities & { focusMode?: string[] }) | undefined =
    track?.getCapabilities();
  if (!track || !capabilities?.focusMode?.includes('continuous')) return;
  const constraints: MediaTrackConstraints & {
    advanced: Array<MediaTrackConstraintSet & { focusMode: string }>;
  } = { advanced: [{ focusMode: 'continuous' }] };
  await track.applyConstraints(constraints);
}

function stopStream(stream: MediaStream) {
  for (const track of stream.getTracks()) track.stop();
}

/** A saved camera can disappear, e.g. after an OS update or on another browser profile. */
function isMissingDevice(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === 'NotFoundError' || error.name === 'OverconstrainedError')
  );
}

function toCameraStatus(error: unknown): CameraStatus {
  if (!(error instanceof DOMException)) return 'error';
  switch (error.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'denied';
    // Android reports a camera held by another app or tab as NotReadableError.
    case 'NotReadableError':
      return 'busy';
    case 'NotSupportedError':
      return 'unavailable';
    default:
      return 'error';
  }
}
