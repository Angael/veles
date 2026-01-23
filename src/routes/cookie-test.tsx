import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';

const SESSION_COOKIE_NAME = 'test-session';

type SessionData = {
	userId: string;
	username: string;
	createdAt: string;
};

// Server function to get session data
const getSession = createServerFn({
	method: 'GET',
}).handler(async () => {
	const sessionCookie = getCookie(SESSION_COOKIE_NAME);

	if (!sessionCookie) {
		return null;
	}

	try {
		const sessionData = JSON.parse(sessionCookie) as SessionData;
		return sessionData;
	} catch {
		return null;
	}
});

// Server function to create a session
const createSession = createServerFn({
	method: 'POST',
}).handler(async () => {
	const sessionData: SessionData = {
		userId: Math.random().toString(36).substring(7),
		username: `user_${Math.floor(Math.random() * 1000)}`,
		createdAt: new Date().toISOString(),
	};

	setCookie(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7, // 7 days
		path: '/',
	});

	return sessionData;
});

// Server function to delete the session
const deleteSession = createServerFn({
	method: 'POST',
}).handler(async () => {
	setCookie(SESSION_COOKIE_NAME, '', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 0, // Expire immediately
		path: '/',
	});

	return { success: true };
});

export const Route = createFileRoute('/cookie-test')({
	component: CookieTestPage,
	loader: async () => {
		const session = await getSession();
		return { session };
	},
});

function CookieTestPage() {
	const router = useRouter();
	const { session } = Route.useLoaderData();

	const handleCreateSession = async () => {
		await createSession();
		router.invalidate();
	};

	const handleDeleteSession = async () => {
		await deleteSession();
		router.invalidate();
	};

	return (
		<div style={{ padding: '20px', fontFamily: 'monospace' }}>
			<h1>Cookie Session Test</h1>

			<div style={{ marginTop: '20px', marginBottom: '20px' }}>
				<h2>Session Status:</h2>
				{session ? (
					<div
						style={{
							background: '#e8f5e9',
							padding: '10px',
							border: '1px solid #4caf50',
						}}
					>
						<p>
							<strong>Session exists!</strong>
						</p>
						<pre>{JSON.stringify(session, null, 2)}</pre>
					</div>
				) : (
					<div
						style={{
							background: '#ffebee',
							padding: '10px',
							border: '1px solid #f44336',
						}}
					>
						<p>
							<strong>No session found</strong>
						</p>
					</div>
				)}
			</div>

			<div style={{ display: 'flex', gap: '10px' }}>
				<button
					type='button'
					onClick={handleCreateSession}
					style={{
						padding: '10px 20px',
						background: '#4caf50',
						color: 'white',
						border: 'none',
						cursor: 'pointer',
					}}
				>
					Create Session
				</button>

				<button
					type='button'
					onClick={handleDeleteSession}
					style={{
						padding: '10px 20px',
						background: '#f44336',
						color: 'white',
						border: 'none',
						cursor: 'pointer',
					}}
				>
					Delete Session
				</button>
			</div>

			<div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
				<p>
					<strong>How it works:</strong>
				</p>
				<ul>
					<li>Server checks for session cookie on page load (SSR)</li>
					<li>
						"Create Session" button creates a new session with random data
					</li>
					<li>"Delete Session" button removes the session cookie</li>
					<li>Cookie is HttpOnly and stored for 7 days</li>
				</ul>
			</div>
		</div>
	);
}
