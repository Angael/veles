import { and, asc, eq, or } from 'drizzle-orm';
import { userConnections, users } from '@veles/db/schema';
import { db } from '@/server/db.server';

/** Loads every account connected to the user, whichever side of the canonical pair it is stored on. */
export function getConnectedUsers(userId: string) {
  return db
    .select({ email: users.email, id: users.id, image: users.image, name: users.name })
    .from(users)
    .innerJoin(
      userConnections,
      or(
        and(eq(userConnections.userLowId, userId), eq(userConnections.userHighId, users.id)),
        and(eq(userConnections.userHighId, userId), eq(userConnections.userLowId, users.id)),
      ),
    )
    .orderBy(asc(users.name));
}
