import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChefHatIcon } from 'lucide-react';
import { recipeLibraryQueryOptions } from '@/pages/recipes/recipes.query';
import { isLoggableIngredient, sumIngredientNutrition } from '@/pages/recipes/recipeNutrition';
import { List, ListItem } from '@/components/ui/list/List';
import { NutritionInline } from '../NutritionInline';
import css from './AddFoodPage.module.css';
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
          <ListItem interactive key={recipe.id}>
            <Link
              className={css.recipeResult}
              search={{ date, recipeId: recipe.id }}
              to='/calories/add'
            >
              <span className={css.recipeIcon}>
                <ChefHatIcon aria-hidden='true' />
              </span>
              <span className={css.recipeName}>
                <strong>{recipe.name}</strong>
                <small>
                  {t({
                    en: `Recipe · ${formatNumber(recipe.portions)} portions`,
                    pl: `Przepis · porcje: ${formatNumber(recipe.portions)}`,
                  })}
                </small>
              </span>
              {perPortion ? (
                <NutritionInline
                  carbs={perPortion.carbs ?? 0}
                  energyMeta={t({ en: '/ portion', pl: '/ porcja' })}
                  fat={perPortion.fat ?? 0}
                  kcal={perPortion.kcal}
                  protein={perPortion.protein ?? 0}
                  stacked
                />
              ) : null}
            </Link>
          </ListItem>
        );
      })}
    </List>
  );
}
