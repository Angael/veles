// Temporary scanner diagnostics: an in-memory event log the debug panel shows and copies.

type DebugEntry = { at: number; data?: unknown; event: string };

const startedAt = performance.now();
const entries: DebugEntry[] = [];
const listeners = new Set<() => void>();
const maxEntries = 400;

/** Runs a browser call that may be missing or throw on some devices, keeping the error. */
function attempt(read: () => unknown) {
  try {
    return read();
  } catch (error) {
    return { readError: String(error) };
  }
}

/** Turns errors, tracks and devices into plain JSON-friendly objects. */
export function describe(value: unknown): unknown {
  if (value instanceof DOMException || value instanceof Error) {
    const extra: Record<string, unknown> = {};
    if ('constraint' in value) extra.constraint = value.constraint;
    return {
      message: value.message,
      name: value.name,
      stack: value.stack?.split('\n').slice(0, 4),
      ...extra,
    };
  }
  if (typeof MediaStreamTrack !== 'undefined' && value instanceof MediaStreamTrack) {
    return {
      capabilities: attempt(() => value.getCapabilities()),
      constraints: value.getConstraints(),
      enabled: value.enabled,
      label: value.label,
      muted: value.muted,
      readyState: value.readyState,
      settings: value.getSettings(),
    };
  }
  if (typeof MediaDeviceInfo !== 'undefined' && value instanceof MediaDeviceInfo) {
    const info: Record<string, unknown> = {
      deviceId: value.deviceId,
      groupId: value.groupId,
      kind: value.kind,
      label: value.label,
    };
    if (typeof InputDeviceInfo !== 'undefined' && value instanceof InputDeviceInfo) {
      info.capabilities = attempt(() => value.getCapabilities());
    }
    return info;
  }
  if (Array.isArray(value)) return value.map(describe);
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, describe(item)]));
  }
  return value;
}

export function debugLog(event: string, data?: unknown) {
  entries.push({ at: Math.round(performance.now() - startedAt), data: describe(data), event });
  if (entries.length > maxEntries) entries.splice(0, entries.length - maxEntries);
  listeners.forEach((listener) => listener());
}

export function subscribeDebugLog(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDebugEntryCount() {
  return entries.length;
}

/** Builds the full report: environment snapshot plus every logged event. */
export function buildDebugReport() {
  const nav = navigator as Navigator & { userAgentData?: unknown; deviceMemory?: number };
  const environment = {
    barcodeDetector: 'BarcodeDetector' in window,
    devicePixelRatio: window.devicePixelRatio,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    isSecureContext: window.isSecureContext,
    mediaDevices: Boolean(navigator.mediaDevices),
    screen: {
      height: screen.height,
      orientation: attempt(() => screen.orientation.type),
      width: screen.width,
    },
    supportedConstraints: attempt(() => navigator.mediaDevices.getSupportedConstraints()),
    time: new Date().toISOString(),
    url: location.href,
    userAgent: navigator.userAgent,
    userAgentData: nav.userAgentData,
    viewport: { height: window.innerHeight, width: window.innerWidth },
    visibility: document.visibilityState,
  };
  return JSON.stringify({ entries, environment });
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) =>
    debugLog('window.error', describe(event.error ?? event.message)),
  );
  window.addEventListener('unhandledrejection', (event) =>
    debugLog('window.unhandledrejection', describe(event.reason)),
  );
  document.addEventListener('visibilitychange', () =>
    debugLog('visibility', document.visibilityState),
  );
}
