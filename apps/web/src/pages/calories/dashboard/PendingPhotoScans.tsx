import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageIcon, LoaderCircleIcon, RotateCwIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { List, ListItem } from '@/components/ui/list/List';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { calorieDashboardKey } from '../calories.query';
import {
  foodPhotoScansQueryOptions,
  useDeleteFoodPhotoScanMutation,
  useRetryFoodPhotoScanMutation,
} from '../photo-scan/foodPhotoScans.query';
import css from './PendingPhotoScans.module.css';

/**
 * Photo products the AI still analyzes, or could not read. When one finishes it leaves this
 * list, so the day log is refreshed to show the new entry.
 */
export function PendingPhotoScans({ date }: { date: string }) {
  const { formatWhole, t } = useI18n();
  const queryClient = useQueryClient();
  const scansQuery = useQuery(foodPhotoScansQueryOptions(date));
  const retryMutation = useRetryFoodPhotoScanMutation();
  const deleteMutation = useDeleteFoodPhotoScanMutation();
  const scans = scansQuery.data ?? [];
  const activeCount = scans.filter((scan) => scan.status !== 'failed').length;
  const previousActiveCount = useRef(activeCount);

  useEffect(() => {
    if (activeCount < previousActiveCount.current) {
      void queryClient.invalidateQueries({ queryKey: calorieDashboardKey });
    }
    previousActiveCount.current = activeCount;
  }, [activeCount, queryClient]);

  if (scans.length === 0) return null;

  return (
    <List aria-label={t({ en: 'Products from photos', pl: 'Produkty ze zdjęć' })} as='ol'>
      {scans.map((scan) => {
        const failed = scan.status === 'failed';
        return (
          <ListItem className={css.row} key={scan.id}>
            {scan.imageUrl ? (
              <img alt='' className={css.thumb} src={scan.imageUrl} />
            ) : (
              <ImageIcon aria-hidden='true' className={css.thumb} />
            )}
            <div className={css.text}>
              <strong>
                {failed
                  ? t({ en: 'Could not read this product', pl: 'Nie udało się odczytać produktu' })
                  : t({ en: 'Analyzing photos…', pl: 'Analizowanie zdjęć…' })}
              </strong>
              <span className={css.meta}>{`${formatWhole(scan.grams)} g`}</span>
            </div>
            {failed ? (
              <div className={css.actions}>
                <Btn
                  aria-label={t({ en: 'Try again', pl: 'Spróbuj ponownie' })}
                  icon={<RotateCwIcon aria-hidden='true' />}
                  iconOnly
                  loading={retryMutation.isPending && retryMutation.variables === scan.id}
                  onClick={() => retryMutation.mutate(scan.id)}
                  size='sm'
                  variant='ghost'
                />
                <Btn
                  aria-label={t({ en: 'Delete', pl: 'Usuń' })}
                  icon={<Trash2Icon aria-hidden='true' />}
                  iconOnly
                  loading={deleteMutation.isPending && deleteMutation.variables === scan.id}
                  onClick={() => deleteMutation.mutate(scan.id)}
                  size='sm'
                  variant='ghost'
                />
              </div>
            ) : (
              <LoaderCircleIcon aria-hidden='true' className={css.spinner} />
            )}
          </ListItem>
        );
      })}
    </List>
  );
}
