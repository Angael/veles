import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient();

export const { getSession, signIn, signOut, useSession } = authClient;
