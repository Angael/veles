import { useEffect, useRef, useState } from 'react';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';

const preferredCameraStorageKey = 'barcodeScanner.preferredCameraId';
const cameraHintDismissedStorageKey = 'barcodeScanner.cameraHintDismissed';

/** Owns the device-local camera preference and replaces stale selections with the active fallback. */
export function useCameraPreference() {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState('');
  const [cameraPreferenceReady, setCameraPreferenceReady] = useState(false);
  const [cameraNotice, setCameraNotice] = useState('');
  const [cameraNoticeVisible, setCameraNoticeVisible] = useState(false);
  const [cameraHintVisible, setCameraHintVisible] = useState(false);
  const cameraNoticeTimeoutRef = useRef<number | undefined>(undefined);
  const [preferredCameraId, setPreferredCameraId] = useLocalStorageState(
    preferredCameraStorageKey,
    '',
  );
  const [cameraHintDismissed, setCameraHintDismissed] = useLocalStorageState(
    cameraHintDismissedStorageKey,
    false,
  );

  useEffect(() => {
    setCameraPreferenceReady(true);
  }, []);

  useEffect(() => {
    if (cameraHintDismissed || countBackwardFacingCameras(cameras) < 2) {
      setCameraHintVisible(false);
      return;
    }

    setCameraHintVisible(true);
    const timeout = window.setTimeout(() => {
      setCameraHintVisible(false);
      setCameraHintDismissed(true);
    }, 6000);
    return () => clearTimeout(timeout);
  }, [cameraHintDismissed, cameras]);

  /** Shows stable camera-position feedback and resets its short dismissal timer. */
  function showCameraNotice(message: string) {
    clearTimeout(cameraNoticeTimeoutRef.current);
    setCameraNotice(message);
    setCameraNoticeVisible(true);
    cameraNoticeTimeoutRef.current = window.setTimeout(() => setCameraNoticeVisible(false), 1200);
  }

  useEffect(
    () => () => {
      clearTimeout(cameraNoticeTimeoutRef.current);
    },
    [],
  );

  function registerActiveCamera(deviceId: string, availableCameras: MediaDeviceInfo[]) {
    setCameras(availableCameras);
    setCurrentDeviceId(deviceId);
    if (deviceId && deviceId !== preferredCameraId) setPreferredCameraId(deviceId);
  }

  function selectNextCamera() {
    if (cameras.length < 2) return undefined;
    const currentIndex = cameras.findIndex((camera) => camera.deviceId === currentDeviceId);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % cameras.length;
    const nextDeviceId = cameras[nextIndex]?.deviceId;
    if (!nextDeviceId) return undefined;

    setCurrentDeviceId(nextDeviceId);
    setPreferredCameraId(nextDeviceId);
    showCameraNotice(`Using camera ${nextIndex + 1}/${cameras.length}`);
    return nextDeviceId;
  }

  function clearUnavailablePreference() {
    if (!preferredCameraId) return false;
    setPreferredCameraId('');
    return true;
  }

  return {
    cameras,
    cameraHintVisible,
    cameraPreferenceReady,
    cameraNotice,
    cameraNoticeVisible,
    clearUnavailablePreference,
    preferredCameraId,
    registerActiveCamera,
    selectNextCamera,
  };
}

/** Counts cameras that identify themselves as rear-facing through capabilities or their label. */
function countBackwardFacingCameras(cameras: MediaDeviceInfo[]) {
  return cameras.filter((camera) => {
    if (typeof InputDeviceInfo !== 'undefined' && camera instanceof InputDeviceInfo) {
      const facingModes = camera.getCapabilities().facingMode;
      if (facingModes?.includes('environment')) return true;
      if (facingModes?.includes('user')) return false;
    }

    return /back|rear|environment/i.test(camera.label);
  }).length;
}
