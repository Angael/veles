import { useMutation } from '@tanstack/react-query';
import { signOut } from '@/lib/auth/client';

export function useSignOutMutation() {
  return useMutation({ mutationFn: () => signOut() });
}
