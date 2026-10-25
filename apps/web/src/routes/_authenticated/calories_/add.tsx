import { type } from 'arktype';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { RecipeLogForm } from '@/pages/calories/add/RecipeLogForm';
import { caloriesDayTarget, normalizeCalorieDate } from '@/pages/calories/calorieHelpers';
import { recipeQueryOptions } from '@/pages/recipes/recipes.query';

// Foods are logged inline on the diary; this route only logs recipes.
export const Route = createFileRoute('/_authenticated/calories_/add')({
  validateSearch: type({
    'date?': 'string',
    'portions?': '0 < number <= 100',
    recipeId: 'string.uuid',
  }),
  loaderDeps: ({ search }) => ({ recipeId: search.recipeId }),
  loader: async ({ context, deps }) => {
    const recipe = await context.queryClient.ensureQueryData(recipeQueryOptions(deps.recipeId));
    // oxlint-disable-next-line typescript/only-throw-error -- Router control flow intentionally throws this object.
    if (!recipe) throw notFound();
    return recipe;
  },
  component: Component,
  staticData: {
    layout: 'task',
    navbar: { backFallback: caloriesDayTarget, label: { en: 'Add food', pl: 'Dodaj jedzenie' } },
  },
});

function Component() {
  const search = Route.useSearch();
  const recipe = Route.useLoaderData();

  return (
    <RecipeLogForm
      initialDate={normalizeCalorieDate(search.date)}
      initialPortions={search.portions}
      key={search.recipeId}
      recipe={recipe}
    />
  );
}
