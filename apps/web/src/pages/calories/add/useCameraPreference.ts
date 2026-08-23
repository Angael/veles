import { useEffect, useRef, useState } from 'react';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';

const preferredCameraStorageKey = 'barcodeScanner.preferredCameraId';
const cameraHintDismissedStorageKey = 'barcodeScanner.cameraHintDismissed';

/** Owns the device-local camera preference and replaces stale selections with the active fallback. */
export function useCameraPreference() {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState('');
  const [cameraNotice, setCameraNotice] = useState('');
  const cameraNoticeTimeoutRef = useRef<number | undefined>(undefined);
  const cameraSwitchPendingRef = useRef(false);
  const [preferredCameraId, setPreferredCameraId] = useLocalStorageState(
    preferredCameraStorageKey,
    '',
  );
  const [cameraHintDismissed, setCameraHintDismissed] = useLocalStorageState(
    cameraHintDismissedStorageKey,
    false,
  );

  /** Shows camera feedback and keeps resetting its dismissal while the control is used repeatedly. */
  function showCameraNotice(message: string) {
    clearTimeout(cameraNoticeTimeoutRef.current);
    setCameraNotice(message);
    cameraNoticeTimeoutRef.current = window.setTimeout(() => setCameraNotice(''), 1800);
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
    cameraSwitchPendingRef.current = true;
    showCameraNotice('Switching camera…');
    return nextDeviceId;
  }

  function clearUnavailablePreference() {
    if (!preferredCameraId) return false;
    setPreferredCameraId('');
    return true;
  }

  function completeCameraSwitch() {
    if (!cameraSwitchPendingRef.current) return;
    cameraSwitchPendingRef.current = false;
    showCameraNotice('Camera switched');
  }

  return {
    cameras,
    cameraNotice,
    cameraHintDismissed,
    clearUnavailablePreference,
    completeCameraSwitch,
    dismissCameraHint: () => setCameraHintDismissed(true),
    preferredCameraId,
    registerActiveCamera,
    selectNextCamera,
  };
}

/** Counts cameras that identify themselves as rear-facing through capabilities or their label. */
export function countBackwardFacingCameras(cameras: MediaDeviceInfo[]) {
  return cameras.filter((camera) => {
    if (typeof InputDeviceInfo !== 'undefined' && camera instanceof InputDeviceInfo) {
      const facingModes = camera.getCapabilities().facingMode;
      if (facingModes?.includes('environment')) return true;
      if (facingModes?.includes('user')) return false;
    }

    return /back|rear|environment/i.test(camera.label);
  }).length;
}
