import { queryOptions, useMutation } from '@tanstack/react-query';
import { calorieDashboardKey } from '../calories.query';
import {
  acceptFoodLogShare,
  declineFoodLogShare,
  getFoodShareRecipients,
  getReceivedFoodLogShares,
  shareFoodLogs,
} from './foodLogShares.api';

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
  return useMutation({
    meta: { error: { title: 'Could not share products' } },
    mutationFn: (data: { logIds: string[]; recipientUserIds: string[] }) => shareFoodLogs({ data }),
  });
}

export function useAcceptFoodLogShareMutation() {
  return useMutation({
    meta: { error: { title: 'Could not add shared products' } },
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
  return useMutation({
    meta: {
      error: { title: 'Could not decline shared products' },
      invalidateQueryKey: receivedFoodLogSharesKey,
    },
    mutationFn: (id: string) => declineFoodLogShare({ data: { id } }),
  });
}
