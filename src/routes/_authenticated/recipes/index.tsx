import { createFileRoute } from '@tanstack/react-router';
import { RecipesPage } from '@/pages/recipes/RecipesPage';
import { getRecipeLibrary } from '@/pages/recipes/recipes.api';

export const Route = createFileRoute('/_authenticated/recipes/')({
  loader: () => getRecipeLibrary(),
  component: RouteComponent,
  head: () => ({ meta: [{ title: 'Recipes' }] }),
  staticData: { navbar: { label: 'Recipes', upTo: { to: '/' } } },
});

function RouteComponent() {
  const recipes = Route.useLoaderData();

  return <RecipesPage recipes={recipes} />;
}
