import { Google } from 'arctic';
import { env } from 'env.ts';

const getBaseUrl = () => {
	if (env.SERVER_URL) return env.SERVER_URL;
	return 'http://localhost:3000';
};

export const google = new Google(
	env.GOOGLE_CLIENT_ID,
	env.GOOGLE_CLIENT_SECRET,
	`${getBaseUrl()}/login/google/callback`,
);

export interface GoogleUser {
	sub: string;
	name: string;
	email: string;
	picture: string;
	email_verified: boolean;
}

export async function getGoogleUser(accessToken: string): Promise<GoogleUser> {
	const response = await fetch(
		'https://openidconnect.googleapis.com/v1/userinfo',
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	if (!response.ok) {
		throw new Error('Failed to fetch Google user');
	}

	return response.json() as Promise<GoogleUser>;
}
