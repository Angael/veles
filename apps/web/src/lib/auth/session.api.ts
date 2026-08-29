import { createServerFn } from '@tanstack/react-start';
import { logMiddleware } from '@/lib/middleware/logMiddleware';
import { getSession } from './getSession';

export interface SessionUser {
  id: string;
  email: string;
  image: string | null;
  name: string;
}

export const getSessionUser = createServerFn({ method: 'GET' })
  // Omitted from logging middleware, since it would spam on every page view a lot
  // .middleware([logMiddleware('getSessionUser')])
  .handler(async (): Promise<SessionUser | null> => {
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
  });
