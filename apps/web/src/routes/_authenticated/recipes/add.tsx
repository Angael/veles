import { createFileRoute } from '@tanstack/react-router';
import { AddRecipePage } from '@/pages/recipes/editor/AddRecipePage';

export const Route = createFileRoute('/_authenticated/recipes/add')({
  ssr: false,
  component: AddRecipePage,

  head: () => ({ meta: [{ title: 'Add recipe' }] }),
  staticData: { navbar: { label: 'Add recipe', upTo: { to: '/recipes' } } },
});
