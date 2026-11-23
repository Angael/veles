import { describe, expect, it } from 'vitest';
import type { FoodPhotoScan } from '../photo-scan/foodPhotoScans.server';
import {
  createPhotoScanSightings,
  type PhotoScanSightings,
  recordPhotoScans,
  settlePhotoScans,
  visiblePhotoScans,
} from './photoScanRows';

const logId = 'log-1';
const working = (status: 'pending' | 'processing' = 'pending'): FoodPhotoScan => ({
  foodLogId: null,
  grams: 50,
  id: 'scan-1',
  imageUrl: null,
  status,
});
const done = (foodLogId: string | null = logId): FoodPhotoScan => ({
  ...working(),
  foodLogId,
  status: 'done',
});
const failed = (): FoodPhotoScan => ({ ...working(), status: 'failed' });

/** One dashboard render: the rows it shows, then the effect that records the scan list. */
function render(sightings: PhotoScanSightings, scans: FoodPhotoScan[], logIds: string[]) {
  const ids = new Set(logIds);
  const visible = visiblePhotoScans(scans, ids, sightings).map((scan) => scan.status);
  const finished = recordPhotoScans(sightings, scans, ids);
  return { finished, visible };
}

describe('photo scan rows', () => {
  it('never brings back a finished scan after its shared log is deleted', () => {
    const sightings = createPhotoScanSightings();
    expect(render(sightings, [working()], []).visible).toEqual(['pending']);
    expect(render(sightings, [working('processing')], []).visible).toEqual(['processing']);

    // The AI finished; the row bridges the gap until the log loads.
    const finish = render(sightings, [done()], []);
    expect(finish.visible).toEqual(['done']);
    expect(finish.finished.map((scan) => scan.id)).toEqual(['scan-1']);

    // The log loaded, then the user shared it and deleted it for themselves. The cached scan
    // list still holds the finished scan with the old log id, as polling has stopped.
    expect(render(sightings, [done()], [logId]).visible).toEqual([]);
    expect(render(sightings, [done()], [logId, 'log-2']).visible).toEqual([]);
    expect(render(sightings, [done()], []).visible).toEqual([]);
  });

  it('hides the finished scan once the log refetch settles, even if the log is already gone', () => {
    const sightings = createPhotoScanSightings();
    render(sightings, [working()], []);
    const { finished } = render(sightings, [done()], []);
    settlePhotoScans(sightings, finished);
    expect(render(sightings, [done()], []).visible).toEqual([]);
  });

  it('does not show a finished scan this dashboard never saw working', () => {
    // A remount or another day with a cached list from just after the scan finished.
    const sightings = createPhotoScanSightings();
    expect(render(sightings, [done()], []).visible).toEqual([]);
    expect(render(sightings, [done()], []).visible).toEqual([]);
  });

  it('does not show a finished scan whose log was deleted on the server', () => {
    const sightings = createPhotoScanSightings();
    render(sightings, [working()], []);
    expect(render(sightings, [done(null)], []).visible).toEqual([]);
  });

  it('reports each finish once', () => {
    const sightings = createPhotoScanSightings();
    render(sightings, [working()], []);
    expect(render(sightings, [done()], []).finished).toHaveLength(1);
    expect(render(sightings, [done()], []).finished).toHaveLength(0);
  });

  it('keeps failed scans visible, also after a retry finishes', () => {
    const sightings = createPhotoScanSightings();
    expect(render(sightings, [failed()], []).visible).toEqual(['failed']);
    expect(render(sightings, [failed()], [logId]).visible).toEqual(['failed']);
    expect(render(sightings, [working()], []).visible).toEqual(['pending']);
    expect(render(sightings, [done()], []).visible).toEqual(['done']);
    expect(render(sightings, [done()], [logId]).visible).toEqual([]);
  });

  it('keeps in-progress scans visible next to a settled one', () => {
    const sightings = createPhotoScanSightings();
    const second = { ...working('processing'), id: 'scan-2' };
    render(sightings, [working(), second], []);
    render(sightings, [done(), second], [logId]);
    expect(render(sightings, [done(), second], []).visible).toEqual(['processing']);
  });

  it('keeps each dashboard separate, so another user or screen starts fresh', () => {
    const owner = createPhotoScanSightings();
    render(owner, [working()], []);
    const other = createPhotoScanSightings();
    expect(render(other, [done()], []).visible).toEqual([]);
    expect(render(owner, [done()], []).visible).toEqual(['done']);
  });
});
