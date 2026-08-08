/// <reference types="vite/client" />
import { AppFrame } from '@/components/app-frame/AppFrame';
import { DefaultCatchBoundary } from '@/components/default-catch-boundary/DefaultCatchBoundary';
import { NotFound } from '@/components/not-found/NotFound';
import { ToastProvider } from '@/components/toast/ToastProvider';
import { getSessionUser } from '@/lib/auth/session.api';
import { clientEnv } from '@/lib/env/client';
import resetCss from '@/styles/reset.css?url';
import type { QueryClient } from '@tanstack/react-query';
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import * as React from 'react';

const isLocalhostApp = import.meta.env.DEV;
const ComponentsDemoLink = React.lazy(() => import('./-ComponentsDemoLink'));

const faviconLinks = isLocalhostApp
  ? [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon-localhost.ico' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32-localhost.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16-localhost.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon-localhost.png' },
      { rel: 'manifest', href: '/site-localhost.webmanifest' },
    ]
  : [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
    ];

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async () => ({ user: await getSessionUser() }),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#060816' },
      { title: clientEnv.appName },
      {
        name: 'description',
        content:
          'Private place for workouts, body weight, food logging, and shared personal files.',
      },
    ],
    links: [{ rel: 'stylesheet', href: resetCss }, ...faviconLinks],
  }),
  errorComponent: (props) => (
    <RootDocument>
      <AppFrame>
        <DefaultCatchBoundary {...props} />
      </AppFrame>
    </RootDocument>
  ),
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  const { user } = Route.useRouteContext();

  return (
    <RootDocument>
      <ToastProvider>
        <AppFrame user={user} />
      </ToastProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <HeadContent />
      </head>
      <body>
        {isLocalhostApp ? <ComponentsDemoLink /> : null}
        {children}
        {/* {import.meta.env.DEV ? (
          <>
            <TanStackRouterDevtools position='bottom-right' />
            <ReactQueryDevtools buttonPosition='bottom-left' />
          </>
        ) : null} */}
        <Scripts />
      </body>
    </html>
  );
}
