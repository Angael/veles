import { useState } from 'react';

const storageKey = 'camera.deviceId';

/** Camera chosen on this device; empty until the user switches cameras. */
export function useStoredCameraId() {
  // Only effects read the id, so a server render without localStorage cannot cause a mismatch.
  const [deviceId, setDeviceId] = useState(() =>
    typeof localStorage === 'undefined'
      ? undefined
      : (localStorage.getItem(storageKey) ?? undefined),
  );

  function storeDeviceId(nextDeviceId: string) {
    localStorage.setItem(storageKey, nextDeviceId);
    setDeviceId(nextDeviceId);
  }

  return [deviceId, storeDeviceId] as const;
}
