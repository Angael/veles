import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { DefaultCatchBoundary } from '@/components/app/default-catch-boundary/DefaultCatchBoundary';
import { NotFound } from '@/components/app/not-found/NotFound';
import { createQueryClient } from '@/lib/queryClient';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  const queryClient = createQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0, // Let TanStack Query control data freshness instead of Router's preload cache.
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    scrollRestoration: true,
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
