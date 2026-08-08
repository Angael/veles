import { createFileRoute } from '@tanstack/react-router';
import { ComponentsDemoPage } from '@/pages/components-demo/ComponentsDemoPage';

export const Route = createFileRoute('/demo/components')({
  component: ComponentsDemoPage,
  head: () => ({ meta: [{ title: 'Components Demo' }] }),
  staticData: {
    navbar: {
      label: 'Components',
      upTo: { to: '/' },
    },
  },
});
