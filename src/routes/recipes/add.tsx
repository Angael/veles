import { createFileRoute } from '@tanstack/react-router';
import { RecipePlaceholderPage } from '@/pages/recipes/RecipePlaceholderPage';

export const Route = createFileRoute('/recipes/add')({
  component: RecipesAddPage,
});

function RecipesAddPage() {
  return (
    <RecipePlaceholderPage
      body='Recipe creation is the next slice. This route exists so the list page can link there now.'
      title='Add recipe'
    />
  );
}
