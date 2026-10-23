import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChefHatIcon } from 'lucide-react';
import { recipeLibraryQueryOptions } from '@/pages/recipes/recipes.query';
import { isLoggableIngredient, sumIngredientNutrition } from '@/pages/recipes/recipeNutrition';
import { List, ListItem } from '@/components/ui/list/List';
import { FoodSummary } from '../FoodSummary';
import { useI18n } from '@/lib/i18n/I18nProvider';

const MAX_RECIPES = 3;

/** The user's own loggable recipes whose name has every typed word, shown above the products. */
export function RecipeResults({ date, query }: { date: string; query: string }) {
  const { formatNumber, t } = useI18n();
  const recipesQuery = useQuery(recipeLibraryQueryOptions());
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const recipes = terms.length
    ? (recipesQuery.data ?? [])
        .filter(
          (recipe) =>
            recipe.isOwned &&
            recipe.ingredients.some(isLoggableIngredient) &&
            terms.every((term) => recipe.name.toLocaleLowerCase().includes(term)),
        )
        .slice(0, MAX_RECIPES)
    : [];

  if (recipes.length === 0) return null;

  return (
    <List aria-label={t({ en: 'Recipes', pl: 'Przepisy' })}>
      {recipes.map((recipe) => {
        const perPortion = sumIngredientNutrition(recipe.ingredients, 1 / recipe.portions);
        return (
          <ListItem interactive key={recipe.id} style={{ padding: 0 }}>
            <FoodSummary
              carbs={perPortion?.carbs}
              density='compact'
              fat={perPortion?.fat}
              icon={<ChefHatIcon aria-hidden='true' />}
              imageUrl={null}
              kcal={perPortion?.kcal}
              kind={t({
                en: `Recipe · ${formatNumber(recipe.portions)} portions`,
                pl: `Przepis · porcje: ${formatNumber(recipe.portions)}`,
              })}
              meta={t({ en: '/ portion', pl: '/ porcja' })}
              name={
                <Link search={{ date, recipeId: recipe.id }} to='/calories/add'>
                  {recipe.name}
                </Link>
              }
              protein={perPortion?.protein}
            />
          </ListItem>
        );
      })}
    </List>
  );
}
