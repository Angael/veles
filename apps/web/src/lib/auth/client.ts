import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient();
export const { signOut } = authClient;
