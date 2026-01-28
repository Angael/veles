import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth/client';

export const Route = createFileRoute('/signup')({
	component: SignupPage,
});

function SignupPage() {
	const navigate = useNavigate();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleEmailSignup = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (password !== confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		if (password.length < 8) {
			setError('Password must be at least 8 characters');
			return;
		}

		setLoading(true);

		const result = await signUp.email({
			name,
			email,
			password,
		});

		setLoading(false);

		if (result.error) {
			setError(result.error.message ?? 'Signup failed');
		} else {
			navigate({ to: '/' });
		}
	};

	const handleGoogleSignup = async () => {
		setError(null);
		setLoading(true);

		await signIn.social({
			provider: 'google',
			callbackURL: '/',
		});
	};

	return (
		<div className='min-h-screen bg-zinc-950 flex items-center justify-center px-4'>
			<div className='w-full max-w-md'>
				<div className='bg-zinc-900 rounded-lg border border-violet-900/20 p-8'>
					<h1 className='text-2xl font-bold text-white mb-6 text-center'>
						Create Account
					</h1>

					{error && (
						<div className='mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/20 text-red-400 text-sm'>
							{error}
						</div>
					)}

					<form onSubmit={handleEmailSignup} className='space-y-4'>
						<div>
							<label
								htmlFor='name'
								className='block text-sm font-medium text-gray-300 mb-1'
							>
								Name
							</label>
							<input
								id='name'
								type='text'
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								className='w-full px-4 py-2 bg-zinc-950 border border-violet-900/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent'
								placeholder='Your name'
							/>
						</div>

						<div>
							<label
								htmlFor='email'
								className='block text-sm font-medium text-gray-300 mb-1'
							>
								Email
							</label>
							<input
								id='email'
								type='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className='w-full px-4 py-2 bg-zinc-950 border border-violet-900/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent'
								placeholder='you@example.com'
							/>
						</div>

						<div>
							<label
								htmlFor='password'
								className='block text-sm font-medium text-gray-300 mb-1'
							>
								Password
							</label>
							<input
								id='password'
								type='password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className='w-full px-4 py-2 bg-zinc-950 border border-violet-900/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent'
								placeholder='Min 8 characters'
							/>
						</div>

						<div>
							<label
								htmlFor='confirmPassword'
								className='block text-sm font-medium text-gray-300 mb-1'
							>
								Confirm Password
							</label>
							<input
								id='confirmPassword'
								type='password'
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								className='w-full px-4 py-2 bg-zinc-950 border border-violet-900/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent'
								placeholder='Confirm your password'
							/>
						</div>

						<button
							type='submit'
							disabled={loading}
							className='w-full py-2 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900'
						>
							{loading ? 'Creating account...' : 'Create account'}
						</button>
					</form>

					<div className='my-6 flex items-center'>
						<div className='flex-1 border-t border-violet-900/20' />
						<span className='px-4 text-gray-400 text-sm'>or</span>
						<div className='flex-1 border-t border-violet-900/20' />
					</div>

					<button
						type='button'
						onClick={handleGoogleSignup}
						disabled={loading}
						className='w-full py-2 px-4 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-950/50 text-white font-medium rounded-lg border border-violet-900/20 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900'
					>
						<svg className='w-5 h-5' viewBox='0 0 24 24' aria-hidden='true'>
							<path
								fill='currentColor'
								d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
							/>
							<path
								fill='currentColor'
								d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
							/>
							<path
								fill='currentColor'
								d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
							/>
							<path
								fill='currentColor'
								d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
							/>
						</svg>
						Continue with Google
					</button>

					<p className='mt-6 text-center text-gray-400 text-sm'>
						Already have an account?{' '}
						<Link
							to='/login'
							className='text-violet-400 hover:text-violet-300 transition-colors'
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
