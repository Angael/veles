import { apiKeyClient } from '@better-auth/api-key/client';
import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient({ plugins: [apiKeyClient()] });
export const { signOut, apiKey } = authClient;
