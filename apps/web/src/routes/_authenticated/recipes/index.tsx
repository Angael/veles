import { createFileRoute } from '@tanstack/react-router';
import { RecipesPage } from '@/pages/recipes/library/RecipesPage';
import { getRecipeLibrary } from '@/pages/recipes/recipes.api';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/recipes/')({
  loader: () => getRecipeLibrary(),
  component: RouteComponent,
  head: () => ({ meta: [{ title: translate({ en: 'Recipes', pl: 'Przepisy' }) }] }),
  staticData: { navbar: { label: { en: 'Recipes', pl: 'Przepisy' } } },
});

function RouteComponent() {
  const recipes = Route.useLoaderData();

  return <RecipesPage recipes={recipes} />;
}
