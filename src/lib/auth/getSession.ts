import { getRequestHeaders } from '@tanstack/react-start/server';
import { auth } from './auth';

export async function getSession() {
  const headers = getRequestHeaders();

  return auth.api.getSession({ headers });
}

export async function getSessionUserId() {
  const session = await getSession();

  return session?.user.id ?? null;
}

export async function requireSession() {
  const session = await getSession();

  if (!session?.user.id) {
    // Used in server functions, no need for 401 http status code
    throw new Error('You need to be signed in.');
  }

  return session;
}
