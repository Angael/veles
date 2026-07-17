import { createFileRoute, notFound } from '@tanstack/react-router';
import { EditRecipePage } from '@/pages/recipes/EditRecipePage';
import { getRecipeById } from '@/pages/recipes/recipes.api';

export const Route = createFileRoute('/recipes/view/$id_/edit')({
  loader: async ({ params }) => {
    const recipe = await getRecipeById({ data: { id: params.id } });

    if (!recipe) {
      throw notFound();
    }

    return recipe;
  },
  component: RouteComponent,
  head: ({ loaderData }) => ({ meta: [{ title: `Edit ${loaderData?.name ?? 'recipe'}` }] }),
  staticData: {
    navbar: {
      label: 'Edit recipe',
      upTo: ({ params }) => {
        const { id } = params;

        return id ? { params: { id }, to: '/recipes/view/$id' } : { to: '/' };
      },
    },
  },
});

function RouteComponent() {
  const recipe = Route.useLoaderData();

  return <EditRecipePage key={recipe.id} recipe={recipe} />;
}
