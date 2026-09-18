/// <reference types="vite/client" />
import { AppFrame } from '@/components/app/app-frame/AppFrame';
import { DefaultCatchBoundary } from '@/components/app/default-catch-boundary/DefaultCatchBoundary';
import { NotFound } from '@/components/app/not-found/NotFound';
import { ToastProvider } from '@/components/ui/toast/ToastProvider';
import { sessionUserQueryOptions } from '@/lib/auth/session.query';
import globalCss from '@/styles/global.css?url';
import type { QueryClient } from '@tanstack/react-query';
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import * as React from 'react';

const appName = import.meta.env.VITE_APP_NAME || 'Veles';
const ComponentsDemoLink = React.lazy(() => import('./-ComponentsDemoLink'));
const faviconConfigByEnvironment = {
  production: { suffix: '', manifest: 'site.webmanifest' },
  development: { suffix: '-dev', manifest: 'site-dev.webmanifest' },
  localhost: { suffix: '-localhost', manifest: 'site-localhost.webmanifest' },
} as const;

const faviconConfig = faviconConfigByEnvironment[import.meta.env.VITE_APP_ENV];

const faviconLinks = [
  { rel: 'icon', type: 'image/x-icon', href: `/favicon${faviconConfig.suffix}.ico` },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    href: `/favicon-32x32${faviconConfig.suffix}.png`,
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    href: `/favicon-16x16${faviconConfig.suffix}.png`,
  },
  {
    rel: 'apple-touch-icon',
    sizes: '180x180',
    href: `/apple-touch-icon${faviconConfig.suffix}.png`,
  },
  { rel: 'manifest', href: `/${faviconConfig.manifest}` },
];

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ context }) => ({
    // Before this was a simple `user: await getSessionUser()` but it fetched for any redirect even when very fresh
    user: await context.queryClient.fetchQuery(sessionUserQueryOptions()),
  }),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: '#060816' },
      { title: appName },
      {
        name: 'description',
        content:
          'Private place for workouts, body weight, food logging, and shared personal files.',
      },
    ],
    links: [{ rel: 'stylesheet', href: globalCss }, ...faviconLinks],
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
        {import.meta.env.VITE_APP_ENV === 'localhost' ? <ComponentsDemoLink /> : null}
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
