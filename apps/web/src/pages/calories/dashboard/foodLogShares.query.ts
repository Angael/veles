import { queryOptions, useMutation } from '@tanstack/react-query';
import { calorieDashboardKey } from '../calories.query';
import {
  acceptFoodLogShare,
  declineFoodLogShare,
  getFoodShareRecipients,
  getReceivedFoodLogShares,
  shareFoodLogs,
} from './foodLogShares.api';
import { useI18n } from '@/lib/i18n/I18nProvider';

const foodShareRecipientsKey = ['food-share-recipients'] as const;
const receivedFoodLogSharesKey = ['received-food-log-shares'] as const;

export function foodShareRecipientsQueryOptions() {
  return queryOptions({
    queryKey: foodShareRecipientsKey,
    queryFn: () => getFoodShareRecipients(),
    staleTime: 30_000,
  });
}

export function receivedFoodLogSharesQueryOptions() {
  return queryOptions({
    queryKey: receivedFoodLogSharesKey,
    queryFn: () => getReceivedFoodLogShares(),
    staleTime: 30_000,
  });
}

export function useShareFoodLogsMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: {
        title: t({ en: 'Could not share products', pl: 'Nie udało się udostępnić produktów' }),
      },
    },
    mutationFn: (data: {
      items: { grams: number | null; logId: string }[];
      recipientUserIds: string[];
    }) => shareFoodLogs({ data }),
  });
}

export function useAcceptFoodLogShareMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: {
        title: t({
          en: 'Could not add shared products',
          pl: 'Nie udało się dodać udostępnionych produktów',
        }),
      },
    },
    mutationFn: (data: { date: string; id: string }) => acceptFoodLogShare({ data }),
    // Settled, not success: a share accepted elsewhere must disappear here too.
    onSettled: (_data, _error, _variables, _onMutateResult, context) =>
      Promise.all([
        context.client.invalidateQueries({ queryKey: calorieDashboardKey }),
        context.client.invalidateQueries({ queryKey: receivedFoodLogSharesKey }),
      ]),
  });
}

export function useDeclineFoodLogShareMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: {
        title: t({
          en: 'Could not decline shared products',
          pl: 'Nie udało się odrzucić udostępnionych produktów',
        }),
      },
      invalidateQueryKey: receivedFoodLogSharesKey,
    },
    mutationFn: (id: string) => declineFoodLogShare({ data: { id } }),
  });
}
