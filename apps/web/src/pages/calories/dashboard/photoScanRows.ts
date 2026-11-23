import type { FoodPhotoScan } from '../photo-scan/foodPhotoScans.server';

type ScanState = Pick<FoodPhotoScan, 'foodLogId' | 'id' | 'status'>;

/** What one dashboard has seen of the photo scans, kept across polls for its whole life. */
export type PhotoScanSightings = {
  /** Last status per scan, so each finish is handled once. */
  statuses: Map<string, FoodPhotoScan['status']>;
  /** Scans this dashboard saw while the AI still worked on them. */
  watched: Set<string>;
  /** Finished scans whose log has loaded; their row never comes back. */
  settled: Set<string>;
};

export function createPhotoScanSightings(): PhotoScanSightings {
  return { settled: new Set(), statuses: new Map(), watched: new Set() };
}

/**
 * Records one scan list and returns the scans that finished since the previous one. A finished
 * scan settles as soon as its log is on the page, so later deleting or moving that log cannot
 * bring the "AI is reading" row back from a cached scan list.
 */
export function recordPhotoScans<Scan extends ScanState>(
  sightings: PhotoScanSightings,
  scans: readonly Scan[],
  logIds: ReadonlySet<string>,
): Scan[] {
  const finished: Scan[] = [];
  for (const scan of scans) {
    const previous = sightings.statuses.get(scan.id);
    sightings.statuses.set(scan.id, scan.status);
    if (scan.status !== 'done') {
      sightings.watched.add(scan.id);
      continue;
    }
    if (scan.foodLogId && logIds.has(scan.foodLogId)) sightings.settled.add(scan.id);
    if (previous !== 'done') finished.push(scan);
  }
  return finished;
}

/** Marks finished scans as settled once the log list has refetched after they finished. */
export function settlePhotoScans(sightings: PhotoScanSightings, scans: readonly ScanState[]) {
  for (const scan of scans) sightings.settled.add(scan.id);
}

/**
 * Scans that still need a placeholder row. Working and failed scans always show. A finished scan
 * only bridges the moment between the AI finishing in front of the user and its log loading;
 * after that, or when this dashboard never saw it working, the log entry speaks for itself.
 */
export function visiblePhotoScans<Scan extends ScanState>(
  scans: readonly Scan[],
  logIds: ReadonlySet<string>,
  sightings: PhotoScanSightings,
): Scan[] {
  return scans.filter(
    (scan) =>
      scan.status !== 'done' ||
      (scan.foodLogId !== null &&
        !logIds.has(scan.foodLogId) &&
        sightings.watched.has(scan.id) &&
        !sightings.settled.has(scan.id)),
  );
}
