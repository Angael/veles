import { createFileRoute, notFound } from '@tanstack/react-router';
import { RecipeViewPage } from '@/pages/recipes/detail/RecipeViewPage';
import { getRecipeById } from '@/pages/recipes/recipes.api';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/recipes/view/$id')({
  loader: async ({ params }) => {
    const recipe = await getRecipeById({ data: { id: params.id } });

    if (!recipe) {
      // oxlint-disable-next-line typescript/only-throw-error -- Router control flow intentionally throws this object.
      throw notFound();
    }

    return recipe;
  },
  component: RouteComponent,
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.name ?? translate({ en: 'Recipe', pl: 'Przepis' }) }],
  }),
  staticData: {
    navbar: { backFallback: { to: '/recipes' }, label: { en: 'Recipe', pl: 'Przepis' } },
  },
});

function RouteComponent() {
  const recipe = Route.useLoaderData();

  return <RecipeViewPage recipe={recipe} />;
}
