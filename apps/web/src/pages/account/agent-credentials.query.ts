import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createAgentCredential,
  getAgentCredentials,
  revokeAgentCredential,
} from './agent-credentials.api';

const queryKey = ['agentCredentials'] as const;

export function useAgentCredentialsQuery() {
  return useQuery({ queryKey, queryFn: () => getAgentCredentials() });
}

export function useCreateAgentCredentialMutation() {
  return useMutation({
    mutationFn: (name: string) => createAgentCredential({ data: { name } }),
    gcTime: 0,
    meta: { invalidateQueryKey: queryKey },
  });
}

export function useRevokeAgentCredentialMutation() {
  return useMutation({
    mutationFn: (id: string) => revokeAgentCredential({ data: { id } }),
    meta: { invalidateQueryKey: queryKey },
  });
}
