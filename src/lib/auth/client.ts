import { createAuthClient } from 'better-auth/react';
import { clientEnv } from '@/lib/env/client';

export const authClient = createAuthClient({
  baseURL: clientEnv.appUrl,
});

export const { getSession, signIn, signOut, signUp, useSession } = authClient;
