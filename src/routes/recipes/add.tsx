import { createFileRoute } from '@tanstack/react-router';
import { AddRecipePage } from '@/pages/recipes/AddRecipePage';

export const Route = createFileRoute('/recipes/add')({
  component: RecipesAddPage,
  head: () => ({ meta: [{ title: 'Add recipe' }] }),
  ssr: false,
});

function RecipesAddPage() {
  return <AddRecipePage />;
}
