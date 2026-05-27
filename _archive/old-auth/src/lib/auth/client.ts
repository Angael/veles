import { createAuthClient } from 'better-auth/react';
import { env } from 'env.ts';

export const authClient = createAuthClient({
	baseURL: env.VITE_BASE_URL,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
