import { queryOptions, useMutation } from '@tanstack/react-query';
import { calorieDashboardKey } from '../calories.query';
import {
  deleteFoodPhotoScan,
  enqueueFoodPhotoScan,
  getFoodPhotoScans,
  retryFoodPhotoScan,
} from './foodPhotoScans.api';
import { useI18n } from '@/lib/i18n/I18nProvider';

export const foodPhotoScansKey = ['food-photo-scans'] as const;
const pollIntervalMs = 4000;

/** Polls while the worker still has scans of this day, then stops. */
export function foodPhotoScansQueryOptions(date: string) {
  return queryOptions({
    queryKey: [...foodPhotoScansKey, date],
    queryFn: () => getFoodPhotoScans({ data: { date } }),
    refetchInterval: (query) =>
      query.state.data?.some((scan) => scan.status !== 'failed') ? pollIntervalMs : false,
  });
}

type EnqueueVariables = {
  barcode?: string;
  date: string;
  front: File;
  grams: number;
  label?: File;
};

export function useEnqueueFoodPhotoScanMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: {
        title: t({ en: 'Could not send the photos', pl: 'Nie udało się wysłać zdjęć' }),
      },
    },
    mutationFn: ({ front, label, ...values }: EnqueueVariables) => {
      const formData = new FormData();
      formData.set('values', JSON.stringify(values));
      formData.set('front', front);
      if (label) formData.set('label', label);
      return enqueueFoodPhotoScan({ data: formData });
    },
    // A barcode match is logged at once, so the dashboard changes too.
    onSuccess: (_data, _variables, _onMutateResult, context) =>
      Promise.all([
        context.client.invalidateQueries({ queryKey: foodPhotoScansKey }),
        context.client.invalidateQueries({ queryKey: calorieDashboardKey }),
      ]),
  });
}

export function useRetryFoodPhotoScanMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: { title: t({ en: 'Could not retry', pl: 'Nie udało się ponowić' }) },
      invalidateQueryKey: foodPhotoScansKey,
    },
    mutationFn: (id: string) => retryFoodPhotoScan({ data: { id } }),
  });
}

export function useDeleteFoodPhotoScanMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: { title: t({ en: 'Could not delete', pl: 'Nie udało się usunąć' }) },
      invalidateQueryKey: foodPhotoScansKey,
    },
    mutationFn: (id: string) => deleteFoodPhotoScan({ data: { id } }),
  });
}
