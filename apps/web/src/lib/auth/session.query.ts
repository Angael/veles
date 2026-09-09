import { queryOptions } from '@tanstack/react-query';
import { getSessionUser } from './session.api';

const sessionUserStaleTime = 5 * 60_000;

export const sessionUserQueryKey = ['session-user'] as const;

export function sessionUserQueryOptions() {
  return queryOptions({
    queryKey: sessionUserQueryKey,
    queryFn: () => getSessionUser(),
    staleTime: sessionUserStaleTime,
  });
}
