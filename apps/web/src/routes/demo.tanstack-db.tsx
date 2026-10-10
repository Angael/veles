import { createFileRoute } from '@tanstack/react-router';
import { getDemoItemsCollection } from '@/pages/tanstack-db-demo/dbLane.collection';
import { rqItemsQueryOptions } from '@/pages/tanstack-db-demo/reactQueryLane.query';
import { TanstackDbDemoPage } from '@/pages/tanstack-db-demo/TanstackDbDemoPage';

export const Route = createFileRoute('/demo/tanstack-db')({
  // The demo collection and fake server live in browser memory only.
  ssr: false,
  // Loaders are bundled with the route tree by default; split this one so TanStack DB stays lazy.
  codeSplitGroupings: [['loader'], ['component']],
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(rqItemsQueryOptions()),
      getDemoItemsCollection(queryClient).preload(),
    ]),
  component: TanstackDbDemoPage,
  head: () => ({ meta: [{ title: 'TanStack DB Demo' }] }),
  staticData: {
    navbar: {
      label: 'TanStack DB',
      backFallback: { to: '/' },
    },
  },
});
