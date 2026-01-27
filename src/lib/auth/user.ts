import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import type { GoogleUser } from './google';

function generateUserId(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export async function findUserByGoogleId(googleId: string) {
	const result = await db
		.select()
		.from(users)
		.where(eq(users.googleId, googleId))
		.limit(1);

	return result[0] ?? null;
}

export async function createUserFromGoogle(googleUser: GoogleUser) {
	const userId = generateUserId();

	const [user] = await db
		.insert(users)
		.values({
			id: userId,
			googleId: googleUser.sub,
			email: googleUser.email,
			name: googleUser.name,
			picture: googleUser.picture,
			type: 'FREE',
		})
		.returning();

	return user;
}

export async function updateUserFromGoogle(
	userId: string,
	googleUser: GoogleUser,
) {
	await db
		.update(users)
		.set({
			name: googleUser.name,
			picture: googleUser.picture,
			lastLoginAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(users.id, userId));
}
