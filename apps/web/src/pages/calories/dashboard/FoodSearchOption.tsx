import { Combobox } from '@base-ui/react/combobox';
import clsx from 'clsx';
import { ChefHatIcon, PlusIcon } from 'lucide-react';
import { foodProductNames } from '../calorieHelpers';
import { FoodSummary } from '../FoodSummary';
import type { FoodSearchResult } from './foodSearchResults';
import { ListItem } from '@/components/ui/list/List';
import css from './FoodSearch.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { sumIngredientNutrition } from '@/pages/recipes/recipeNutrition';

function nutritionAtGrams(valuePer100g: number | null, grams: number) {
  return Math.round(((valuePer100g ?? 0) * grams) / 100);
}

/** Renders one search result: a food at its usual size, a recipe per portion, or "create". */
export function FoodSearchOption({ result }: { result: FoodSearchResult }) {
  const { formatNumber, formatWhole, t } = useI18n();

  if (result.kind === 'create') {
    return (
      <Combobox.Item
        className={clsx(css.option, css.createOption)}
        render={<ListItem interactive />}
        value={result}
      >
        <PlusIcon aria-hidden='true' />
        <span>{t({ en: `Create “${result.name}”`, pl: `Utwórz produkt „${result.name}”` })}</span>
      </Combobox.Item>
    );
  }

  if (result.kind === 'recipe') {
    const { recipe } = result;
    const perPortion = sumIngredientNutrition(recipe.ingredients, 1 / recipe.portions);
    return (
      <Combobox.Item className={css.option} render={<ListItem interactive />} value={result}>
        <FoodSummary
          carbs={perPortion?.carbs}
          density='tight'
          fat={perPortion?.fat}
          icon={<ChefHatIcon aria-hidden='true' />}
          imageUrl={null}
          kcal={perPortion?.kcal}
          kind={t({
            en: `Recipe · ${formatNumber(recipe.portions)} portions`,
            pl: `Przepis · porcje: ${formatNumber(recipe.portions)}`,
          })}
          meta={t({ en: '/ portion', pl: '/ porcja' })}
          name={recipe.name}
          protein={perPortion?.protein}
        />
      </Combobox.Item>
    );
  }

  const { food } = result;
  const grams = food.productSizeGrams ?? 100;
  return (
    <Combobox.Item className={css.option} render={<ListItem interactive />} value={result}>
      <FoodSummary
        carbs={nutritionAtGrams(food.carbsPer100g, grams)}
        category={food.category}
        density='tight'
        fat={nutritionAtGrams(food.fatPer100g, grams)}
        imageUrl={food.imageUrl}
        kcal={nutritionAtGrams(food.kcalPer100g, grams)}
        meta={`${formatWhole(grams)} g`}
        name={t(foodProductNames(food))}
        protein={nutritionAtGrams(food.proteinPer100g, grams)}
      />
    </Combobox.Item>
  );
}
