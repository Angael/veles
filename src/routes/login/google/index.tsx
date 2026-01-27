import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { setCookie } from '@tanstack/react-start/server';
import { generateCodeVerifier, generateState } from 'arctic';
import { google } from '@/lib/auth';

const initiateGoogleOAuth = createServerFn({ method: 'GET' }).handler(
	async () => {
		const state = generateState();
		const codeVerifier = generateCodeVerifier();

		const url = google.createAuthorizationURL(state, codeVerifier, [
			'openid',
			'profile',
			'email',
		]);

		// Store state and code verifier in cookies
		setCookie('google_oauth_state', state, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 10, // 10 minutes
			path: '/',
		});

		setCookie('google_oauth_code_verifier', codeVerifier, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 10, // 10 minutes
			path: '/',
		});

		return url.toString();
	},
);

export const Route = createFileRoute('/login/google/')({
	beforeLoad: async () => {
		const url = await initiateGoogleOAuth();
		throw redirect({ href: url });
	},
	component: () => null,
});
