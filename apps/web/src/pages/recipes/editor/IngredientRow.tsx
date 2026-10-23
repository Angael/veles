import { Trash2Icon } from 'lucide-react';
import type { CalorieFood } from '@/pages/calories/calories.api';
import { FoodSummary } from '@/pages/calories/FoodSummary';
import { Btn } from '@/components/ui/btn/Btn';
import { ListItem } from '@/components/ui/list/List';
import { ingredientNutrition } from '../recipeNutrition';
import type { IngredientDraft } from './recipeDraft';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  ingredient: IngredientDraft;
  onEdit: () => void;
  onRemove: () => void;
  /** The linked product, once the foods list has loaded. */
  product: CalorieFood | undefined;
};

/** One ingredient shown like a food row; its name opens the ingredient dialog. */
export function IngredientRow({ ingredient, onEdit, onRemove, product }: Props) {
  const { formatNumber, t } = useI18n();
  const nutrition = ingredientNutrition({
    grams: ingredient.grams,
    productId: ingredient.productId,
    per100g: product
      ? {
          kcal: product.kcalPer100g,
          protein: product.proteinPer100g,
          fat: product.fatPer100g,
          carbs: product.carbsPer100g,
        }
      : null,
  });

  function meta() {
    if (nutrition) return `${formatNumber(Math.round(ingredient.grams ?? 0))} g`;
    if (ingredient.productId)
      return t({
        en: 'Product · add grams to count it',
        pl: 'Produkt · podaj gramy, aby go liczyć',
      });
    return t({ en: 'Custom · not logged', pl: 'Własny · nie trafia do dziennika' });
  }

  return (
    <ListItem style={{ padding: 0 }}>
      <FoodSummary
        action={
          <Btn
            aria-label={t({ en: 'Remove ingredient', pl: 'Usuń składnik' })}
            icon={<Trash2Icon aria-hidden='true' />}
            iconOnly
            onClick={onRemove}
            size='sm'
            type='button'
            variant='ghostDanger'
          />
        }
        carbs={nutrition?.carbs}
        category={product?.category}
        density='compact'
        fat={nutrition?.fat}
        imageUrl={product?.imageUrl ?? null}
        kcal={nutrition?.kcal}
        meta={meta()}
        name={
          <button onClick={onEdit} type='button'>
            {ingredient.name}
          </button>
        }
        protein={nutrition?.protein}
      />
    </ListItem>
  );
}
