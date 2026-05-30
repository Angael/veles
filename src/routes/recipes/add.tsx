import { createFileRoute } from '@tanstack/react-router';
import { Card } from '@/components/Card';

export const Route = createFileRoute('/recipes/add')({
  component: RecipesAddPage,
});

function RecipesAddPage() {
  return (
    <Card as='article'>
      <h1>Add recipe</h1>
      <p>
        Recipe creation is the next slice. This route exists so the list page can link there now.
      </p>
    </Card>
  );
}
