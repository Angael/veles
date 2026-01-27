import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';
import { z } from 'zod';
import {
	createSession,
	createUserFromGoogle,
	findUserByGoogleId,
	getGoogleUser,
	getSessionCookieOptions,
	google,
	SESSION_COOKIE_NAME,
	updateUserFromGoogle,
} from '@/lib/auth';

type CallbackParams = {
	code?: string;
	state?: string;
};

const handleGoogleCallback = createServerFn({ method: 'POST' })
	.inputValidator((d: CallbackParams) => d)
	.handler(async ({ data }) => {
		const { code, state } = data;

		const storedState = getCookie('google_oauth_state');
		const storedCodeVerifier = getCookie('google_oauth_code_verifier');

		// Validate state
		if (!code || !state || !storedState || !storedCodeVerifier) {
			return { error: 'Invalid OAuth state' };
		}

		if (state !== storedState) {
			return { error: 'State mismatch' };
		}

		try {
			// Exchange code for tokens
			const tokens = await google.validateAuthorizationCode(
				code,
				storedCodeVerifier,
			);

			// Get user info from Google
			const googleUser = await getGoogleUser(tokens.accessToken());

			// Find or create user
			let user = await findUserByGoogleId(googleUser.sub);

			if (!user) {
				user = await createUserFromGoogle(googleUser);
			} else {
				// Update user info on each login
				await updateUserFromGoogle(user.id, googleUser);
			}

			// Create session
			const session = await createSession(user.id);

			// Set session cookie
			setCookie(
				SESSION_COOKIE_NAME,
				session.id,
				getSessionCookieOptions(session.expiresAt),
			);

			// Clear OAuth cookies
			setCookie('google_oauth_state', '', {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 0,
				path: '/',
			});
			setCookie('google_oauth_code_verifier', '', {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 0,
				path: '/',
			});

			return { success: true };
		} catch (error) {
			console.error('OAuth error:', error);
			return { error: 'Authentication failed' };
		}
	});

const searchSchema = z.object({
	code: z.string().optional(),
	state: z.string().optional(),
});

export const Route = createFileRoute('/login/google/callback')({
	validateSearch: searchSchema,
	beforeLoad: async ({ search }) => {
		const result = await handleGoogleCallback({ data: search });

		if ('error' in result) {
			throw redirect({
				to: '/login',
				search: { error: result.error },
			});
		}

		throw redirect({ to: '/' });
	},
	component: () => null,
});
