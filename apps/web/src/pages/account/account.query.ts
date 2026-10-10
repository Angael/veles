import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { sessionUserQueryKey } from '@/lib/auth/session.query';
import { apiKey, signOut } from '@/lib/auth/client';
import type { AgentFeature } from '@/lib/agentAccess';
import {
  getAgentPermissions,
  setAllAgentPermissions,
  updateAgentPermission,
} from './agent-access.api';
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

const connectionsQueryKey = ['connections'] as const;

const connectionsQueryOptions = queryOptions({
  queryFn: () => getConnections(),
  queryKey: connectionsQueryKey,
});

export function useConnectionsQuery() {
  return useQuery(connectionsQueryOptions);
}

const sharingSettingsQueryKey = ['sharingSettings'] as const;

const sharingSettingsQueryOptions = queryOptions({
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

/** Better Auth's client returns `{ data, error }`; React Query needs a throw. */
function unwrap<T>({ data, error }: { data: T | null; error: { message?: string } | null }) {
  if (error || data === null) throw new Error(error?.message ?? 'Request failed');
  return data;
}

const apiKeysQueryKey = ['apiKeys'] as const;

export function useApiKeysQuery() {
  return useQuery({
    queryFn: async () => unwrap(await apiKey.list()).apiKeys,
    queryKey: apiKeysQueryKey,
  });
}

export function useCreateApiKeyMutation() {
  return useMutation({
    gcTime: 0,
    meta: { invalidateQueryKey: apiKeysQueryKey },
    mutationFn: async (name: string) => unwrap(await apiKey.create({ name })),
  });
}

export function useDeleteApiKeyMutation() {
  return useMutation({
    meta: { invalidateQueryKey: apiKeysQueryKey },
    mutationFn: async (keyId: string) => unwrap(await apiKey.delete({ keyId })),
  });
}

const agentPermissionsQueryKey = ['agentPermissions'] as const;

export function useAgentPermissionsQuery() {
  return useQuery({
    queryKey: agentPermissionsQueryKey,
    queryFn: () => getAgentPermissions(),
  });
}

export function useUpdateAgentPermissionMutation() {
  return useMutation({
    meta: { invalidateQueryKey: agentPermissionsQueryKey },
    mutationFn: (data: { feature: AgentFeature; access: 'read' | 'write'; enabled: boolean }) =>
      updateAgentPermission({ data }),
  });
}

export function useSetAllAgentPermissionsMutation() {
  return useMutation({
    meta: { invalidateQueryKey: agentPermissionsQueryKey },
    mutationFn: (data: { access: 'read' | 'write'; enabled: boolean }) =>
      setAllAgentPermissions({ data }),
  });
}
