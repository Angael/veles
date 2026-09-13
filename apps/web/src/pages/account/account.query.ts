import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { sessionUserQueryKey } from '@/lib/auth/session.query';
import { signOut } from '@/lib/auth/client';
import {
  acceptConnectionInvitation,
  disconnectUser,
  getConnections,
  removeConnectionInvitation,
  sendConnectionInvitation,
} from './connections.api';
import {
  getSharingSettings,
  type SharingSetting,
  updateSharingSetting,
} from './sharing-settings.api';

export function useSignOutMutation() {
  return useMutation({
    mutationFn: () => signOut(),
    onSuccess: (result, _variables, _onMutateResult, context) => {
      if (!result.error) {
        context.client.removeQueries({ queryKey: sessionUserQueryKey });
      }
    },
  });
}

export const connectionsQueryKey = ['connections'] as const;

export const connectionsQueryOptions = queryOptions({
  queryFn: () => getConnections(),
  queryKey: connectionsQueryKey,
});

export function useConnectionsQuery() {
  return useQuery(connectionsQueryOptions);
}

export const sharingSettingsQueryKey = ['sharingSettings'] as const;

export const sharingSettingsQueryOptions = queryOptions({
  queryFn: () => getSharingSettings(),
  queryKey: sharingSettingsQueryKey,
});

export function useSharingSettingsQuery() {
  return useQuery(sharingSettingsQueryOptions);
}

export function useUpdateSharingSettingMutation() {
  return useMutation({
    meta: { invalidateQueryKey: sharingSettingsQueryKey },
    mutationFn: ({ enabled, setting }: { enabled: boolean; setting: SharingSetting }) =>
      updateSharingSetting({ data: { enabled, setting } }),
  });
}

export function useSendConnectionInvitationMutation() {
  return useMutation({
    meta: { invalidateQueryKey: connectionsQueryKey },
    mutationFn: (email: string) => sendConnectionInvitation({ data: { email } }),
  });
}

export function useAcceptConnectionInvitationMutation() {
  return useMutation({
    meta: { invalidateQueryKey: connectionsQueryKey },
    mutationFn: (id: string) => acceptConnectionInvitation({ data: { id } }),
  });
}

export function useRemoveConnectionInvitationMutation() {
  return useMutation({
    meta: { invalidateQueryKey: connectionsQueryKey },
    mutationFn: (id: string) => removeConnectionInvitation({ data: { id } }),
  });
}

export function useDisconnectUserMutation() {
  return useMutation({
    meta: { invalidateQueryKey: connectionsQueryKey },
    mutationFn: (userId: string) => disconnectUser({ data: { userId } }),
  });
}
