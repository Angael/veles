import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { SESSION_COOKIE_NAME, validateSession } from '@/lib/auth';

const checkAuth = createServerFn({ method: 'GET' }).handler(async () => {
	const sessionId = getCookie(SESSION_COOKIE_NAME);
	if (!sessionId) return null;

	const { user } = await validateSession(sessionId);
	return user;
});

export const Route = createFileRoute('/login/')({
	beforeLoad: async () => {
		const user = await checkAuth();
		if (user) {
			throw redirect({ to: '/' });
		}
	},
	component: LoginPage,
});

function LoginPage() {
	return (
		<div className='flex min-h-[80vh] items-center justify-center'>
			<div className='w-full max-w-md space-y-8 rounded-lg border border-violet-900/20 bg-zinc-900 p-8'>
				<div className='text-center'>
					<h1 className='text-2xl font-bold text-white'>Sign in to Veles</h1>
					<p className='mt-2 text-gray-400'>
						Use your Google account to continue
					</p>
				</div>

				<Link
					to='/login/google'
					className='flex w-full items-center justify-center gap-3 rounded-md bg-white px-4 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-100'
				>
					<svg className='h-5 w-5' viewBox='0 0 24 24' aria-hidden='true'>
						<path
							fill='currentColor'
							d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
						/>
						<path
							fill='#34A853'
							d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
						/>
						<path
							fill='#FBBC05'
							d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
						/>
						<path
							fill='#EA4335'
							d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
						/>
						<path fill='none' d='M1 1h22v22H1z' />
					</svg>
					Continue with Google
				</Link>
			</div>
		</div>
	);
}
