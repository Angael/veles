import { DbClient } from '@tanstack/react-db';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { routerWithDbClient } from '@tanstack/react-router-with-db';
import { DefaultCatchBoundary } from '@/components/app/default-catch-boundary/DefaultCatchBoundary';
import { NotFound } from '@/components/app/not-found/NotFound';
import { createQueryClient } from '@/lib/queryClient';
import { scrollRestorationKey } from '@/lib/routing/scrollRestorationKey';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  const queryClient = createQueryClient();
  // One DbClient per request (server) or app (browser); query collections read the QueryClient from it.
  const dbClient = new DbClient({ queryClient });

  const router = createRouter({
    routeTree,
    context: { dbClient, queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0, // Let TanStack Query control data freshness instead of Router's preload cache.
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    scrollRestoration: true,
    getScrollRestorationKey: scrollRestorationKey,
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  // After the Query integration, so DB dehydration wraps it. Streams TanStack DB state to the browser.
  return routerWithDbClient(router, dbClient);
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
