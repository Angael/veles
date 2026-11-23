import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { List } from '@/components/ui/list/List';
import { toastManager } from '@/components/ui/toast/toastManager';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { calorieDashboardKey } from '../calories.query';
import {
  foodPhotoScansQueryOptions,
  usePhotoScanUploads,
} from '../photo-scan/foodPhotoScans.query';
import { PhotoScanRow } from './PhotoScanRow';
import {
  createPhotoScanSightings,
  recordPhotoScans,
  settlePhotoScans,
  visiblePhotoScans,
} from './photoScanRows';

type Props = { date: string; logIds: ReadonlySet<string> };

/**
 * Products the AI still works on, from the moment the user sends them. A scan that finishes
 * while shown stays until its log entry has loaded, so the row turns into the entry without a gap.
 */
export function PendingPhotoScans({ date, logIds }: Props) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const scans = useQuery(foodPhotoScansQueryOptions(date)).data;
  const uploads = usePhotoScanUploads(date);
  const sightings = useRef(createPhotoScanSightings()).current;
  const [, setSettledCount] = useState(0);

  useEffect(() => {
    const finished = recordPhotoScans(sightings, scans ?? [], logIds);
    if (finished.length === 0) return;
    for (const scan of finished) {
      if (sightings.watched.has(scan.id) && scan.grams === null) {
        toastManager.add({
          title: t({ en: 'Product added', pl: 'Dodano produkt' }),
          type: 'success',
        });
      }
    }
    void queryClient.invalidateQueries({ queryKey: calorieDashboardKey }).finally(() => {
      settlePhotoScans(sightings, finished);
      setSettledCount((count) => count + finished.length);
    });
  }, [logIds, queryClient, scans, sightings, t]);

  const visibleScans = visiblePhotoScans(scans ?? [], logIds, sightings);
  if (uploads.length === 0 && visibleScans.length === 0) return null;

  return (
    <List aria-label={t({ en: 'Products from photos', pl: 'Produkty ze zdjęć' })} as='ol'>
      {visibleScans.map((scan) => (
        <PhotoScanRow
          grams={scan.grams}
          imageUrl={scan.imageUrl}
          key={scan.id}
          scanId={scan.id}
          status={scan.status}
        />
      ))}
      {uploads.map((upload) => (
        <PhotoScanRow
          grams={upload.grams ?? null}
          imageUrl={upload.previewUrl}
          key={`upload-${upload.id}`}
          status='uploading'
        />
      ))}
    </List>
  );
}
