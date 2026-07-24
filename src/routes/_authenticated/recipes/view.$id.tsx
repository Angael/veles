import { createFileRoute, notFound } from '@tanstack/react-router';
import { RecipeViewPage } from '@/pages/recipes/RecipeViewPage';
import { getRecipeById } from '@/pages/recipes/recipes.api';

export const Route = createFileRoute('/_authenticated/recipes/view/$id')({
  loader: async ({ params }) => {
    const recipe = await getRecipeById({ data: { id: params.id } });

    if (!recipe) {
      throw notFound();
    }

    return recipe;
  },
  component: RouteComponent,
  head: ({ loaderData }) => ({ meta: [{ title: loaderData?.name ?? 'Recipe' }] }),
  staticData: { navbar: { label: 'Recipe', upTo: { to: '/recipes' } } },
});

function RouteComponent() {
  const recipe = Route.useLoaderData();

  return <RecipeViewPage recipe={recipe} />;
}
