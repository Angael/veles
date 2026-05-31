import { createFileRoute } from '@tanstack/react-router';
import { RecipePlaceholderPage } from '@/pages/recipes/RecipePlaceholderPage';

export const Route = createFileRoute('/recipes/view/$id')({
  component: RecipeViewPage,
});

function RecipeViewPage() {
  const { id } = Route.useParams();

  return (
    <RecipePlaceholderPage
      body='Recipe detail page is the next slice.'
      subtitle={`Selected recipe id: ${id}`}
      title='Recipe view'
    />
  );
}
