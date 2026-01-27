import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';
import {
	getDeleteSessionCookieOptions,
	invalidateSession,
	SESSION_COOKIE_NAME,
} from '@/lib/auth';

const handleLogout = createServerFn({ method: 'GET' }).handler(async () => {
	const sessionId = getCookie(SESSION_COOKIE_NAME);

	if (sessionId) {
		await invalidateSession(sessionId);
	}

	setCookie(SESSION_COOKIE_NAME, '', getDeleteSessionCookieOptions());

	return { success: true };
});

export const Route = createFileRoute('/logout')({
	beforeLoad: async () => {
		await handleLogout();
		throw redirect({ to: '/login' });
	},
	component: () => null,
});
