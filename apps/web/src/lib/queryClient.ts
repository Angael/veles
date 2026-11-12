import { MutationCache, QueryClient, type QueryKey } from '@tanstack/react-query';
import { toastManager } from '@/components/ui/toast/toastManager';

type MutationNotification = {
  id?: string;
  message?: string;
  priority?: 'high' | 'low';
  timeout?: number;
  title: string;
};

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      error?: MutationNotification;
      invalidateQueryKey?: QueryKey;
      success?: MutationNotification;
    };
  }
}

/** Creates an isolated query client and handles mutation-wide UI effects declared in mutation meta. */
export function createQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    mutationCache: new MutationCache({
      onError: (_error, _variables, _onMutateResult, mutation) => {
        if (mutation.meta?.error) {
          addMutationToast('error', mutation.meta.error);
        }
      },
      onSuccess: async (_data, _variables, _onMutateResult, mutation) => {
        if (mutation.meta?.success) {
          addMutationToast('success', mutation.meta.success);
        }
        if (mutation.meta?.invalidateQueryKey) {
          await queryClient.invalidateQueries({ queryKey: mutation.meta.invalidateQueryKey });
        }
      },
    }),
  });

  return queryClient;
}

function addMutationToast(type: 'error' | 'success', notification: MutationNotification) {
  toastManager.add({
    description: notification.message,
    id: notification.id,
    priority: notification.priority ?? (type === 'error' ? 'high' : undefined),
    timeout: notification.timeout,
    title: notification.title,
    type,
  });
}
