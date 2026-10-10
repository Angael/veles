import { queryOptions, useMutation } from '@tanstack/react-query';
import { rqServer } from './fakeServer';

const rqItemsQueryKey = ['demo', 'rq-items'];

export function rqItemsQueryOptions() {
  return queryOptions({ queryFn: () => rqServer.list(), queryKey: rqItemsQueryKey });
}

export function useRqSetCheckedMutation() {
  return useMutation({
    meta: { error: { title: 'Item could not be saved' }, invalidateQueryKey: rqItemsQueryKey },
    mutationFn: (variables: { checked: boolean; id: string }) =>
      rqServer.update(variables.id, { checked: variables.checked }),
  });
}

export function useRqCreateMutation() {
  return useMutation({
    meta: { error: { title: 'Item could not be added' }, invalidateQueryKey: rqItemsQueryKey },
    mutationFn: (variables: { id: string; name: string }) => rqServer.create(variables),
  });
}

export function useRqDeleteMutation() {
  return useMutation({
    meta: { error: { title: 'Item could not be deleted' }, invalidateQueryKey: rqItemsQueryKey },
    mutationFn: (variables: { id: string }) => rqServer.remove(variables.id),
  });
}
