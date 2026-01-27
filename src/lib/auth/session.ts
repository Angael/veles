import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { userSessions, users } from '@/db/schema';

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type SessionUser = typeof users.$inferSelect;
export type Session = typeof userSessions.$inferSelect;

export interface SessionValidationResult {
	session: Session | null;
	user: SessionUser | null;
}

function generateSessionToken(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export async function createSession(userId: string): Promise<Session> {
	const sessionId = generateSessionToken();
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

	const [session] = await db
		.insert(userSessions)
		.values({
			id: sessionId,
			userId,
			expiresAt,
		})
		.returning();

	return session;
}

export async function validateSession(
	sessionId: string,
): Promise<SessionValidationResult> {
	const result = await db
		.select({
			session: userSessions,
			user: users,
		})
		.from(userSessions)
		.innerJoin(users, eq(userSessions.userId, users.id))
		.where(eq(userSessions.id, sessionId))
		.limit(1);

	if (result.length === 0) {
		return { session: null, user: null };
	}

	const { session, user } = result[0];

	// Check if session is expired
	if (session.expiresAt < new Date()) {
		await invalidateSession(sessionId);
		return { session: null, user: null };
	}

	// Extend session if it expires in less than 15 days
	const fifteenDaysFromNow = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
	if (session.expiresAt < fifteenDaysFromNow) {
		const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
		await db
			.update(userSessions)
			.set({ expiresAt: newExpiresAt })
			.where(eq(userSessions.id, sessionId));
		session.expiresAt = newExpiresAt;
	}

	return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(userSessions).where(eq(userSessions.id, sessionId));
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
	await db.delete(userSessions).where(eq(userSessions.userId, userId));
}

// Cookie configuration
export const SESSION_COOKIE_NAME = 'session';

export function getSessionCookieOptions(expiresAt: Date) {
	return {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax' as const,
		expires: expiresAt,
		path: '/',
	};
}

export function getDeleteSessionCookieOptions() {
	return {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax' as const,
		maxAge: 0,
		path: '/',
	};
}
