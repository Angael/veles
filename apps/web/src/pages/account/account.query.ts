import { useMutation } from '@tanstack/react-query';
import { sessionUserQueryKey } from '@/lib/auth/session.query';
import { signOut } from '@/lib/auth/client';

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
