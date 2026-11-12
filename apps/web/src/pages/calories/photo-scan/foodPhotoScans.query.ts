import { queryOptions, useMutation, useMutationState } from '@tanstack/react-query';
import { calorieDashboardKey } from '../calories.query';
import {
  deleteFoodPhotoScan,
  enqueueFoodPhotoScan,
  getFoodPhotoScans,
  retryFoodPhotoScan,
} from './foodPhotoScans.api';
import { toastManager } from '@/components/ui/toast/toastManager';
import { useI18n } from '@/lib/i18n/I18nProvider';

export const foodPhotoScansKey = ['food-photo-scans'] as const;
const enqueueMutationKey = ['enqueue-food-photo-scan'] as const;
const pollIntervalMs = 2000;

/** Polls while the worker still has scans of this day, then stops. */
export function foodPhotoScansQueryOptions(date: string) {
  return queryOptions({
    queryKey: [...foodPhotoScansKey, date],
    queryFn: () => getFoodPhotoScans({ data: { date } }),
    refetchInterval: (query) =>
      query.state.data?.some((scan) => scan.status === 'pending' || scan.status === 'processing')
        ? pollIntervalMs
        : false,
  });
}

type EnqueueVariables = {
  barcode?: string;
  date: string;
  grams?: number;
  photos: File[];
  /** Object URL for the pending row; released when the upload ends. */
  previewUrl: string;
};

export function useEnqueueFoodPhotoScanMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: {
        title: t({ en: 'Could not send the photos', pl: 'Nie udało się wysłać zdjęć' }),
      },
    },
    mutationKey: enqueueMutationKey,
    mutationFn: ({ barcode, date, grams, photos }: EnqueueVariables) => {
      const formData = new FormData();
      formData.set('values', JSON.stringify({ barcode, date, grams }));
      for (const photo of photos) formData.append('photos', photo);
      return enqueueFoodPhotoScan({ data: formData });
    },
    // A barcode match is logged at once, so the dashboard changes too. Waiting for the refetch
    // keeps the optimistic row until the server row replaces it.
    onSuccess: async (result, _variables, _onMutateResult, context) => {
      await Promise.all([
        context.client.invalidateQueries({ queryKey: foodPhotoScansKey }),
        context.client.invalidateQueries({ queryKey: calorieDashboardKey }),
      ]);
      if (result.status === 'logged') {
        toastManager.add({
          title: t({ en: `Logged ${result.name}`, pl: `Dodano ${result.name}` }),
          type: 'success',
        });
      } else if (result.status === 'exists') {
        toastManager.add({
          title: t({
            en: `Already in products: ${result.name}`,
            pl: `Już w produktach: ${result.name}`,
          }),
        });
      }
    },
    onSettled: (_data, _error, variables) => URL.revokeObjectURL(variables.previewUrl),
  });
}

/** Photos still uploading for this day. Mutation state survives leaving the form and refetches. */
export function usePhotoScanUploads(date: string) {
  return useMutationState({
    filters: { mutationKey: enqueueMutationKey, status: 'pending' },
    select: (mutation) => ({
      id: mutation.mutationId,
      ...(mutation.state.variables as EnqueueVariables),
    }),
  }).filter((upload) => upload.date === date);
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
