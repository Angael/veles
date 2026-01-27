import { TanStackDevtools } from '@tanstack/react-devtools';
import type { QueryClient } from '@tanstack/react-query';
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import {
	SESSION_COOKIE_NAME,
	type SessionUser,
	validateSession,
} from '@/lib/auth';
import Header from '../components/Header';
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools';
import appCss from '../styles.css?url';

const getUser = createServerFn({ method: 'GET' }).handler(async () => {
	const sessionId = getCookie(SESSION_COOKIE_NAME);
	if (!sessionId) return null;

	const { user } = await validateSession(sessionId);
	return user;
});

interface MyRouterContext {
	queryClient: QueryClient;
	user: SessionUser | null;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async () => {
		const user = await getUser();
		return { user };
	},
	head: () => ({
		meta: [
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{
				title: 'TanStack Start Starter',
			},
		],
		links: [
			{
				rel: 'stylesheet',
				href: appCss,
			},
		],
	}),
	component: RootComponent,
	shellComponent: RootDocument,
});

function RootComponent() {
	const { user } = Route.useRouteContext();
	return (
		<>
			<Header user={user} />
			<Outlet />
		</>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en' className='dark'>
			<head>
				<HeadContent />
			</head>
			<body className='bg-zinc-950 text-white'>
				{children}
				<TanStackDevtools
					config={{
						position: 'bottom-right',
					}}
					plugins={[
						{
							name: 'Tanstack Router',
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
