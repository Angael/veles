import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { List } from '@/components/ui/list/List';
import { toastManager } from '@/components/ui/toast/toastManager';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { calorieDashboardKey } from '../calories.query';
import {
  foodPhotoScansQueryOptions,
  usePhotoScanUploads,
} from '../photo-scan/foodPhotoScans.query';
import { PhotoScanRow } from './PhotoScanRow';

type Props = { date: string; logIds: ReadonlySet<string> };

/**
 * Products the AI still works on, from the moment the user sends them. A finished scan stays
 * until its log entry has loaded, so the row turns into the entry without a gap.
 */
export function PendingPhotoScans({ date, logIds }: Props) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const scans = useQuery(foodPhotoScansQueryOptions(date)).data;
  const uploads = usePhotoScanUploads(date);
  const seenStatuses = useRef(new Map<string, string>());

  useEffect(() => {
    let finished = false;
    for (const scan of scans ?? []) {
      const previous = seenStatuses.current.get(scan.id);
      seenStatuses.current.set(scan.id, scan.status);
      if (scan.status !== 'done' || previous === 'done') continue;
      finished = true;
      if (previous && scan.grams === null) {
        toastManager.add({
          title: t({ en: 'Product added', pl: 'Dodano produkt' }),
          type: 'success',
        });
      }
    }
    if (finished) void queryClient.invalidateQueries({ queryKey: calorieDashboardKey });
  }, [queryClient, scans, t]);

  const visibleScans = (scans ?? []).filter(
    (scan) => scan.status !== 'done' || (scan.foodLogId && !logIds.has(scan.foodLogId)),
  );
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
