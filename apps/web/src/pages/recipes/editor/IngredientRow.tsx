import { Trash2Icon } from 'lucide-react';
import type { CalorieFood } from '@/pages/calories/calories.api';
import { FoodSummary } from '@/pages/calories/FoodSummary';
import { Btn } from '@/components/ui/btn/Btn';
import { ListItem } from '@/components/ui/list/List';
import type { IngredientDraft } from './recipeDraft';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  ingredient: IngredientDraft;
  onEdit: () => void;
  onRemove: () => void;
  /** The linked product, once the foods list has loaded. */
  product: CalorieFood | undefined;
};

/** One ingredient shown like a food row; the whole row opens the ingredient dialog. */
export function IngredientRow({ ingredient, onEdit, onRemove, product }: Props) {
  const { formatNumber, t } = useI18n();
  const { grams } = ingredient;
  const factor = product && grams ? grams / 100 : null;

  function meta() {
    if (factor !== null) return `${formatNumber(grams ?? 0)} g`;
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
        carbs={factor === null ? undefined : (product?.carbsPer100g ?? 0) * factor}
        category={product?.category}
        density='compact'
        fat={factor === null ? undefined : (product?.fatPer100g ?? 0) * factor}
        imageUrl={product?.imageUrl ?? null}
        kcal={factor === null ? undefined : (product?.kcalPer100g ?? 0) * factor}
        meta={meta()}
        name={
          <button onClick={onEdit} type='button'>
            {ingredient.name}
          </button>
        }
        protein={factor === null ? undefined : (product?.proteinPer100g ?? 0) * factor}
      />
    </ListItem>
  );
}
