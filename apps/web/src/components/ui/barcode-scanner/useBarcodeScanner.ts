import type { DetectedBarcode, Point2D } from 'barcode-detector/pure';
import { useEffect, useEffectEvent, useState, type RefObject } from 'react';
import { createDetector } from './barcodeDetector';

export type ScannedBarcode = {
  value: string;
  /** Barcode corners in video pixels; `frame` is the video size they refer to. */
  corners: Point2D[];
  frame: { height: number; width: number };
};

type BarcodeScannerOptions = {
  enabled: boolean;
  onScan: (value: string) => void;
  /** Turns a detected code into the value to report; `null` ignores the code. */
  read?: (barcode: DetectedBarcode) => string | null;
};

const scanIntervalMs = 250;
/** A barcode out of view for this long is forgotten, so showing it again counts as a new scan. */
const forgetAfterMs = 750;

/**
 * Decodes the video a few times per second. Calls `onScan` once each time a barcode comes into
 * view and returns the barcode in view, so it can be outlined.
 */
export function useBarcodeScanner(
  videoRef: RefObject<HTMLVideoElement | null>,
  { enabled, onScan, read = (barcode) => barcode.rawValue }: BarcodeScannerOptions,
) {
  const [barcode, setBarcode] = useState<ScannedBarcode | null>(null);
  const [failed, setFailed] = useState(false);
  const readValue = useEffectEvent(read);
  const reportScan = useEffectEvent(onScan);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let current: ScannedBarcode | null = null;
    let lastSeenAt = 0;

    function findBarcode(results: DetectedBarcode[], video: HTMLVideoElement) {
      for (const result of results) {
        const value = readValue(result);
        if (value) {
          const frame = { height: video.videoHeight, width: video.videoWidth };
          return { corners: result.cornerPoints, frame, value };
        }
      }
      return null;
    }

    function update(found: ScannedBarcode | null) {
      const now = performance.now();
      if (found) {
        if (found.value !== current?.value) reportScan(found.value);
        lastSeenAt = now;
      } else if (now - lastSeenAt < forgetAfterMs) {
        return;
      }
      current = found;
      setBarcode(found);
    }

    async function scan(signal: AbortSignal) {
      const detector = await createDetector();
      for (;;) {
        signal.throwIfAborted();
        const video = videoRef.current;
        if (video && video.readyState >= video.HAVE_CURRENT_DATA) {
          const results = await detector.detect(video);
          signal.throwIfAborted();
          update(findBarcode(results, video));
        }
        await new Promise((resolve) => setTimeout(resolve, scanIntervalMs));
      }
    }

    scan(controller.signal).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, [enabled, videoRef]);

  return { barcode, failed };
}
