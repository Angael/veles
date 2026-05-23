/// <reference types="vite/client" />
import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import * as React from 'react';
import { AppFrame } from '@/components/AppFrame';
import { DefaultCatchBoundary } from '@/components/DefaultCatchBoundary';
import { NotFound } from '@/components/NotFound';
import { clientEnv } from '@/lib/env/client';
import resetCss from '@/styles/reset.css?url';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: clientEnv.appName },
      {
        name: 'description',
        content:
          'Private place for workouts, body weight, food logging, and shared personal files.',
      },
    ],
    links: [{ rel: 'stylesheet', href: resetCss }],
  }),
  errorComponent: (props) => (
    <RootDocument>
      <DefaultCatchBoundary {...props} />
    </RootDocument>
  ),
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <AppFrame />
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
        {children}
        {import.meta.env.DEV ? (
          <>
            <TanStackRouterDevtools position='bottom-right' />
            <ReactQueryDevtools buttonPosition='bottom-left' />
          </>
        ) : null}
        <Scripts />
      </body>
    </html>
  );
}
