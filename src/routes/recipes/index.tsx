import { createFileRoute } from '@tanstack/react-router';
import { RecipesPage } from '@/pages/recipes/RecipesPage';
import { DEFAULT_RECIPES_QUERY_INPUT, recipesQueryOptions } from '@/pages/recipes/recipes.query';

export const Route = createFileRoute('/recipes/')({
  loader: ({ context }) =>
    (
      context as { queryClient: import('@tanstack/react-query').QueryClient }
    ).queryClient.ensureQueryData(recipesQueryOptions(DEFAULT_RECIPES_QUERY_INPUT)),
  component: RecipesPage,
});
