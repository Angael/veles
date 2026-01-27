import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { SESSION_COOKIE_NAME, validateSession } from './session';

/**
 * Server function to check if user is authenticated.
 * Returns the user if authenticated, null otherwise.
 */
export const getAuthUser = createServerFn({ method: 'GET' }).handler(
	async () => {
		const sessionId = getCookie(SESSION_COOKIE_NAME);
		if (!sessionId) return null;

		const { user } = await validateSession(sessionId);
		return user;
	},
);

/**
 * Use in route's beforeLoad to require authentication.
 * Redirects to /login if not authenticated.
 *
 * @example
 * export const Route = createFileRoute('/protected')({
 *   beforeLoad: async () => {
 *     await requireAuth();
 *   },
 *   component: ProtectedPage,
 * });
 */
export async function requireAuth() {
	const user = await getAuthUser();
	if (!user) {
		throw redirect({ to: '/login' });
	}
	return user;
}

/**
 * Use in route's beforeLoad to require a specific user type.
 *
 * @example
 * export const Route = createFileRoute('/admin')({
 *   beforeLoad: async () => {
 *     await requireUserType(['ADMIN']);
 *   },
 *   component: AdminPage,
 * });
 */
export async function requireUserType(
	allowedTypes: ('FREE' | 'PREMIUM' | 'ADMIN')[],
) {
	const user = await requireAuth();
	if (!allowedTypes.includes(user.type)) {
		throw redirect({ to: '/' });
	}
	return user;
}
