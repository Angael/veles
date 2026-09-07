import { createFileRoute } from '@tanstack/react-router';
import { AddRecipePage } from '@/pages/recipes/AddRecipePage';

export const Route = createFileRoute('/_authenticated/recipes/add')({
  component: RecipesAddPage,
  ssr: false,
  head: () => ({ meta: [{ title: 'Add recipe' }] }),
  staticData: { navbar: { label: 'Add recipe', upTo: { to: '/recipes' } } },
});

function RecipesAddPage() {
  return <AddRecipePage />;
}
