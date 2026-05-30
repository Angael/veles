import { createFileRoute } from '@tanstack/react-router';
import { Card } from '@/components/Card';

export const Route = createFileRoute('/recipes/view/$id')({
  component: RecipeViewPage,
});

function RecipeViewPage() {
  const { id } = Route.useParams();

  return (
    <Card as='article'>
      <h1>Recipe view</h1>
      <p>Recipe detail page is the next slice.</p>
      <p>Selected recipe id: {id}</p>
    </Card>
  );
}
