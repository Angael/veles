import { type } from 'arktype';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { AddFoodPage } from '@/pages/calories/add/AddFoodPage';
import { RecipeLogForm } from '@/pages/calories/add/RecipeLogForm';
import { calorieFoodQueryOptions, calorieFoodsQueryOptions } from '@/pages/calories/calories.query';
import { caloriesDayTarget, normalizeCalorieDate } from '@/pages/calories/calorieHelpers';
import { recipeQueryOptions } from '@/pages/recipes/recipes.query';

export const Route = createFileRoute('/_authenticated/calories_/add')({
  validateSearch: type({
    'date?': 'string',
    'foodId?': 'string',
    'portions?': '0 < number <= 100',
    'recipeId?': 'string.uuid',
  }),
  loaderDeps: ({ search }) => ({ foodId: search.foodId, recipeId: search.recipeId }),
  loader: async ({ context, deps }) => {
    if (deps.recipeId) {
      const recipe = await context.queryClient.ensureQueryData(recipeQueryOptions(deps.recipeId));
      // oxlint-disable-next-line typescript/only-throw-error -- Router control flow intentionally throws this object.
      if (!recipe) throw notFound();
      return recipe;
    }
    if (deps.foodId) {
      return context.queryClient.ensureQueryData(calorieFoodQueryOptions(deps.foodId));
    }

    return context.queryClient.ensureQueryData(calorieFoodsQueryOptions());
  },
  component: Component,
  staticData: {
    layout: 'task',
    navbar: { backFallback: caloriesDayTarget, label: { en: 'Add food', pl: 'Dodaj jedzenie' } },
  },
});

function Component() {
  const search = Route.useSearch();
  const data = Route.useLoaderData();
  const date = normalizeCalorieDate(search.date);

  if (search.recipeId && 'ingredients' in data) {
    return (
      <RecipeLogForm
        initialDate={date}
        initialPortions={search.portions}
        key={search.recipeId}
        recipe={data}
      />
    );
  }
  return <AddFoodPage date={date} foodId={search.foodId} />;
}
