import { createServerFn } from '@tanstack/react-start';
import { getSession } from '@/server/getSession.server';

export interface SessionUser {
  id: string;
  email: string;
  image: string | null;
  name: string;
}

export const getSessionUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => {
    const session = await getSession();

    if (!session) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      image: session.user.image ?? null,
      name: session.user.name,
    };
  },
);
