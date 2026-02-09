import { createAuthClient } from 'better-auth/react';
import { clientEnv } from 'env-client.ts';

export const authClient = createAuthClient({
	baseURL: clientEnv.VITE_BASE_URL,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
