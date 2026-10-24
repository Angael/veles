import { createFileRoute, notFound } from '@tanstack/react-router';
import { EditRecipePage } from '@/pages/recipes/editor/EditRecipePage';
import { getEditableRecipeById } from '@/pages/recipes/recipes.api';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/recipes/view/$id_/edit')({
  loader: async ({ params }) => {
    const recipe = await getEditableRecipeById({ data: { id: params.id } });

    if (!recipe) {
      // oxlint-disable-next-line typescript/only-throw-error -- Router control flow intentionally throws this object.
      throw notFound();
    }

    return recipe;
  },
  component: RouteComponent,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: translate({
          en: `Edit ${loaderData?.name ?? 'recipe'}`,
          pl: `Edytuj ${loaderData?.name ?? 'przepis'}`,
        }),
      },
    ],
  }),
  staticData: {
    layout: 'task',
    navbar: {
      backFallback: ({ params }) => ({ params: { id: params.id ?? '' }, to: '/recipes/view/$id' }),
      label: { en: 'Edit recipe', pl: 'Edytuj przepis' },
    },
  },
});

function RouteComponent() {
  const recipe = Route.useLoaderData();

  return <EditRecipePage key={recipe.id} recipe={recipe} />;
}
