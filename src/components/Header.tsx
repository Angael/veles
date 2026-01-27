import { Link } from '@tanstack/react-router';
import {
	ChevronDown,
	ChevronRight,
	Cookie,
	Home,
	Image,
	LogIn,
	LogOut,
	Menu,
	Network,
	SquareFunction,
	StickyNote,
	User,
	X,
} from 'lucide-react';
import { useState } from 'react';
import type { SessionUser } from '@/lib/auth';

interface HeaderProps {
	user: SessionUser | null;
}

export default function Header({ user }: HeaderProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [groupedExpanded, setGroupedExpanded] = useState<
		Record<string, boolean>
	>({});

	return (
		<>
			<header className='p-4 flex items-center justify-between bg-zinc-950 text-white shadow-lg border-b border-violet-900/20'>
				<div className='flex items-center'>
					<button
						type='button'
						onClick={() => setIsOpen(true)}
						className='p-2 hover:bg-violet-900/20 rounded-lg transition-colors'
						aria-label='Open menu'
					>
						<Menu size={24} />
					</button>
					<h1 className='ml-4 text-xl font-semibold'>
						<Link
							to='/'
							className='text-violet-400 hover:text-violet-300 transition-colors'
						>
							Veles
						</Link>
					</h1>
				</div>

				<div className='flex items-center gap-3'>
					{user ? (
						<>
							<div className='flex items-center gap-2'>
								{user.picture ? (
									<img
										src={user.picture}
										alt={user.name ?? 'User'}
										className='w-8 h-8 rounded-full'
									/>
								) : (
									<User size={20} className='text-gray-400' />
								)}
								<span className='text-sm text-gray-300 hidden sm:inline'>
									{user.name ?? user.email}
								</span>
							</div>
							<Link
								to='/logout'
								className='p-2 hover:bg-violet-900/20 rounded-lg transition-colors text-gray-400 hover:text-white'
								aria-label='Sign out'
							>
								<LogOut size={20} />
							</Link>
						</>
					) : (
						<Link
							to='/login'
							className='flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors text-sm font-medium'
						>
							<LogIn size={18} />
							Sign in
						</Link>
					)}
				</div>
			</header>

			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-zinc-950 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-violet-900/20 ${
					isOpen ? 'translate-x-0' : '-translate-x-full'
				}`}
			>
				<div className='flex items-center justify-between p-4 border-b border-violet-900/20'>
					<h2 className='text-xl font-bold text-violet-400'>Navigation</h2>
					<button
						type='button'
						onClick={() => setIsOpen(false)}
						className='p-2 hover:bg-violet-900/20 rounded-lg transition-colors'
						aria-label='Close menu'
					>
						<X size={24} />
					</button>
				</div>

				<nav className='flex-1 p-4 overflow-y-auto'>
					<Link
						to='/'
						onClick={() => setIsOpen(false)}
						className='flex items-center gap-3 p-3 rounded-lg hover:bg-violet-900/20 transition-colors mb-2'
						activeProps={{
							className:
								'flex items-center gap-3 p-3 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors mb-2',
						}}
					>
						<Home size={20} />
						<span className='font-medium'>Home</span>
					</Link>

					<Link
						to='/cookie-test'
						onClick={() => setIsOpen(false)}
						className='flex items-center gap-3 p-3 rounded-lg hover:bg-violet-900/20 transition-colors mb-2'
						activeProps={{
							className:
								'flex items-center gap-3 p-3 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors mb-2',
						}}
					>
						<Cookie size={20} />
						<span className='font-medium'>Session Test</span>
					</Link>

					<Link
						to='/media'
						onClick={() => setIsOpen(false)}
						className='flex items-center gap-3 p-3 rounded-lg hover:bg-violet-900/20 transition-colors mb-2'
						activeProps={{
							className:
								'flex items-center gap-3 p-3 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors mb-2',
						}}
					>
						<Image size={20} />
						<span className='font-medium'>Media</span>
					</Link>

					{/* Demo Links Start */}

					<Link
						to='/demo/start/server-funcs'
						onClick={() => setIsOpen(false)}
						className='flex items-center gap-3 p-3 rounded-lg hover:bg-violet-900/20 transition-colors mb-2'
						activeProps={{
							className:
								'flex items-center gap-3 p-3 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors mb-2',
						}}
					>
						<SquareFunction size={20} />
						<span className='font-medium'>Start - Server Functions</span>
					</Link>

					<Link
						to='/demo/start/api-request'
						onClick={() => setIsOpen(false)}
						className='flex items-center gap-3 p-3 rounded-lg hover:bg-violet-900/20 transition-colors mb-2'
						activeProps={{
							className:
								'flex items-center gap-3 p-3 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors mb-2',
						}}
					>
						<Network size={20} />
						<span className='font-medium'>Start - API Request</span>
					</Link>

					<div className='flex flex-row justify-between'>
						<Link
							to='/demo/start/ssr'
							onClick={() => setIsOpen(false)}
							className='flex-1 flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2'
							activeProps={{
								className:
									'flex-1 flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
							}}
						>
							<StickyNote size={20} />
							<span className='font-medium'>Start - SSR Demos</span>
						</Link>
						<button
							type='button'
							className='p-2 hover:bg-violet-900/20 rounded-lg transition-colors'
							onClick={() =>
								setGroupedExpanded((prev) => ({
									...prev,
									StartSSRDemo: !prev.StartSSRDemo,
								}))
							}
						>
							{groupedExpanded.StartSSRDemo ? (
								<ChevronDown size={20} />
							) : (
								<ChevronRight size={20} />
							)}
						</button>
					</div>
					{groupedExpanded.StartSSRDemo && (
						<div className='flex flex-col ml-4'>
							<Link
								to='/demo/start/ssr/spa-mode'
								onClick={() => setIsOpen(false)}
								className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2'
								activeProps={{
									className:
										'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
								}}
							>
								<StickyNote size={20} />
								<span className='font-medium'>SPA Mode</span>
							</Link>

							<Link
								to='/demo/start/ssr/full-ssr'
								onClick={() => setIsOpen(false)}
								className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2'
								activeProps={{
									className:
										'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
								}}
							>
								<StickyNote size={20} />
								<span className='font-medium'>Full SSR</span>
							</Link>

							<Link
								to='/demo/start/ssr/data-only'
								onClick={() => setIsOpen(false)}
								className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2'
								activeProps={{
									className:
										'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
								}}
							>
								<StickyNote size={20} />
								<span className='font-medium'>Data Only</span>
							</Link>
						</div>
					)}

					<Link
						to='/demo/tanstack-query'
						onClick={() => setIsOpen(false)}
						className='flex items-center gap-3 p-3 rounded-lg hover:bg-violet-900/20 transition-colors mb-2'
						activeProps={{
							className:
								'flex items-center gap-3 p-3 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors mb-2',
						}}
					>
						<Network size={20} />
						<span className='font-medium'>TanStack Query</span>
					</Link>

					{/* Demo Links End */}
				</nav>
			</aside>
		</>
	);
}
